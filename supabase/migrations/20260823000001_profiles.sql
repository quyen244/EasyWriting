-- Accounts.
--
-- `auth.users` is Supabase's and we never touch it. `public.profiles` is the part of an
-- account this product owns: the display name a learner chose, the language they read the
-- interface in, and the band they are aiming for.
--
-- The existing table is dropped rather than altered. It was created by hand in the
-- dashboard and is not reproducible from this repository, which is the thing every
-- migration here exists to fix. The project is a scratch environment (CLARIFICATION.md
-- S-2) so nothing of value goes with it.

drop table if exists public.profiles cascade;

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,

  -- Interface language. Held here rather than only in localStorage so a learner who
  -- signs in on a second device is not silently switched back to English.
  locale      text not null default 'en' check (locale in ('en', 'vi')),

  -- The band they are working towards. Nullable because most learners have not decided,
  -- and a made-up target is worse than none on a progress chart.
  target_band numeric(2,1) check (target_band is null or (target_band between 1 and 9 and (target_band * 2) = floor(target_band * 2))),

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Product-owned account data. One row per auth.users row, created by trigger.';

-- ── updated_at ────────────────────────────────────────────────────────────────
--
-- A shared trigger function rather than one per table: the behaviour is identical
-- everywhere and duplicating it is how the copies start to disagree.

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ── Profile creation ──────────────────────────────────────────────────────────
--
-- Driven by a trigger, not by the client after sign-up (CLARIFICATION.md A-4).
--
-- A client-side insert is one closed tab away from producing an account with no profile,
-- and it would not fire at all for a user created from the dashboard or the admin API.
-- The trigger cannot be forgotten and cannot be skipped.
--
-- SECURITY DEFINER because the inserting role during sign-up is `supabase_auth_admin`,
-- which has no rights on `public`. `search_path` is pinned so the elevated function
-- cannot be redirected by a hostile search_path.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    -- Falls back to the local part of the email, so the sidebar always has something
    -- to show. Sign-up does not require a name (A-6).
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Access ────────────────────────────────────────────────────────────────────
--
-- A learner reads and edits their own row and no other. There is no policy granting
-- INSERT: rows arrive only through the trigger above.

alter table public.profiles enable row level security;

create policy "profiles are readable by their owner"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles are editable by their owner"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

-- The owner may change how the product addresses them and what they are aiming for.
-- `email` is deliberately absent: it is `auth.users`' copy of the truth, and letting it
-- drift here would give the product two answers to "who is this".
grant update (full_name, locale, target_band) on public.profiles to authenticated;
