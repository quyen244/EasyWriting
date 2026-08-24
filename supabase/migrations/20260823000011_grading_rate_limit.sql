-- A cap on how often one learner can spend the model budget.
--
-- Constitution Principle V requires every paid endpoint to be rate-limited;
-- CLARIFICATION.md S-6 sets the number at 20 gradings per hour per learner. Until now
-- nothing enforced it: a learner could submit in a loop and the only thing between them
-- and an unbounded bill was that they probably would not think to.
--
-- Enforced in the database, at the INSERT, rather than in the Edge Function. Two
-- reasons, and the second is the one that matters:
--
--   1. Rejecting in the function means the row already exists and has already been
--      claimed — work done to decide not to do the work.
--   2. The INSERT is the real boundary. The client is not the only thing that could
--      submit, and a limit that only exists in one caller is not a limit.
--
-- ── Why a separate ledger, and not `count(*) from writing_attempts` ───────────
--
-- The obvious implementation counts the learner's recent rows. It does not work here:
-- `20260823000004` grants `authenticated` DELETE on their own attempts (deliberately —
-- a learner may remove their own work). Counting a table the caller can delete from
-- means the limit resets on demand: submit twenty, delete twenty, submit twenty more.
--
-- So submissions are counted in an append-only ledger the learner has no grant on at
-- all. Deleting an attempt still deletes the attempt; it no longer refunds the quota.

create table public.grading_submissions (
  id         bigserial primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- The only query this table serves: "how many in the last hour, for this learner".
create index grading_submissions_window_idx
  on public.grading_submissions (user_id, created_at desc);

comment on table public.grading_submissions is
  'Append-only quota ledger. Separate from writing_attempts because a learner may '
  'delete their attempts, and a deletable counter is not a limit.';

-- No policies and no grants: RLS with zero policies denies everyone, and service_role
-- bypasses it. Not readable, not writable, not visible from any user token — the
-- trigger below writes it as the table owner.
alter table public.grading_submissions enable row level security;
revoke all on public.grading_submissions from anon, authenticated;
revoke all on sequence public.grading_submissions_id_seq from anon, authenticated;

-- ── The limit ─────────────────────────────────────────────────────────────────

create or replace function public.grading_rate_limit()
returns int language sql immutable as $$ select 20 $$;

create or replace function public.grading_rate_window()
returns interval language sql immutable as $$ select interval '1 hour' $$;

comment on function public.grading_rate_limit is
  'CLARIFICATION.md S-6: 20 gradings per learner per hour. A function, not a literal, '
  'so the number is changed in one place and is visible to anything that wants to '
  'display it.';

create or replace function public.enforce_grading_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent  int;
  ceiling int := public.grading_rate_limit();
begin
  select count(*) into recent
    from public.grading_submissions
   where user_id = new.user_id
     and created_at > now() - public.grading_rate_window();

  if recent >= ceiling then
    -- PostgREST turns a SQLSTATE of PT### into that HTTP status, so this surfaces as a
    -- real 429 the client can act on rather than an opaque 500. The message is shown to
    -- the learner, so it says what to do, not what went wrong internally.
    raise exception 'You have submitted % pieces of writing in the last hour. The limit is %. Please try again later.',
      recent, ceiling
      using errcode = 'PT429';
  end if;

  insert into public.grading_submissions (user_id) values (new.user_id);
  return new;
end;
$$;

-- BEFORE INSERT: the quota is checked and consumed before the row exists, so a
-- submission that is over the limit never becomes an attempt and never reaches dispatch.
create trigger writing_attempts_rate_limit
  before insert on public.writing_attempts
  for each row execute function public.enforce_grading_rate_limit();

revoke all on function public.enforce_grading_rate_limit() from public, anon, authenticated;

-- ── Housekeeping ──────────────────────────────────────────────────────────────
--
-- The ledger only ever answers a one-hour question, so anything older is dead weight.
-- Kept for a day rather than an hour so it is still useful for answering "did this
-- learner hit the limit yesterday?" while support is looking at it.

create or replace function public.prune_grading_submissions()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  removed int;
begin
  delete from public.grading_submissions where created_at < now() - interval '1 day';
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.prune_grading_submissions() from public, anon, authenticated;

select cron.unschedule('prune-grading-submissions')
 where exists (select 1 from cron.job where jobname = 'prune-grading-submissions');

select cron.schedule('prune-grading-submissions', '17 3 * * *',
                     $$ select public.prune_grading_submissions() $$);
