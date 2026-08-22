-- The Writing mock test: its content, and a learner's sitting of it.
--
-- Content lives in the database rather than in the frontend bundle (CLARIFICATION.md,
-- round 2) so that fixing a typo in an exam prompt is an UPDATE, not a redeploy.
--
-- Bilingual fields are jsonb `{"en": …, "vi": …}` rather than paired _en/_vi columns, so
-- adding a third language later is a data change instead of an ALTER on every table.
-- The exam *material* — prompts, the figures to report on — stays English in both
-- locales, because it is the thing being examined. Only wrapper text is translated.

-- ── Content ───────────────────────────────────────────────────────────────────

create table public.mock_tests (
  id               text primary key,
  title            jsonb not null,
  duration_minutes int  not null check (duration_minutes > 0),
  -- Retiring a test hides it from the picker without deleting the sittings that
  -- reference it. Deleting content a learner's history points at would leave the
  -- history unreadable.
  is_active        boolean not null default true,
  position         int not null default 0,
  created_at       timestamptz not null default now()
);

comment on column public.mock_tests.title is 'Bilingual: {"en": "...", "vi": "..."}';

create table public.mock_test_tasks (
  id                uuid primary key default gen_random_uuid(),
  test_id           text not null references public.mock_tests (id) on delete cascade,
  task_type         text not null check (task_type in ('TASK_1', 'TASK_2')),
  prompt            text not null,
  -- Task 1 only: the data to report on. Text rather than an image, because the mock
  -- test is scored from what the candidate writes about it.
  stimulus          text,
  stimulus_caption  text,
  min_words         int  not null check (min_words > 0),
  suggested_minutes int  not null check (suggested_minutes > 0),
  position          int  not null,

  -- A test has exactly one Task 1 and one Task 2. The constraint says so.
  unique (test_id, task_type)
);

create index mock_test_tasks_test_idx on public.mock_test_tasks (test_id, position);

-- ── A sitting ─────────────────────────────────────────────────────────────────

create table public.mock_test_attempts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  test_id         text not null references public.mock_tests (id) on delete restrict,

  started_at      timestamptz not null default now(),
  submitted_at    timestamptz,
  elapsed_seconds int check (elapsed_seconds >= 0),

  -- Task 1 counts once, Task 2 twice, rounded to the half band — the official
  -- weighting. Written by a trigger once both tasks are scored (migration 004), never
  -- by the candidate.
  combined_band   numeric(2,1) check (combined_band is null or combined_band between 1 and 9),

  status          text not null default 'in_progress'
                    check (status in ('in_progress', 'submitted', 'scored')),

  constraint submitted_attempts_have_a_time
    check (status = 'in_progress' or submitted_at is not null)
);

create index mock_test_attempts_user_idx
  on public.mock_test_attempts (user_id, started_at desc);

-- ── Access ────────────────────────────────────────────────────────────────────
--
-- Content is world-readable to signed-in learners; sittings belong to one person.

alter table public.mock_tests         enable row level security;
alter table public.mock_test_tasks    enable row level security;
alter table public.mock_test_attempts enable row level security;

create policy "active tests are readable by any signed-in learner"
  on public.mock_tests for select to authenticated using (is_active);

create policy "tasks of active tests are readable by any signed-in learner"
  on public.mock_test_tasks for select to authenticated
  using (exists (
    select 1 from public.mock_tests t
    where t.id = mock_test_tasks.test_id and t.is_active
  ));

create policy "sittings are readable by their owner"
  on public.mock_test_attempts for select to authenticated
  using (user_id = (select auth.uid()));

create policy "a learner starts their own sitting"
  on public.mock_test_attempts for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "a learner finishes their own sitting"
  on public.mock_test_attempts for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.mock_tests, public.mock_test_tasks, public.mock_test_attempts
  from anon, authenticated;

grant select on public.mock_tests, public.mock_test_tasks to authenticated;
grant select on public.mock_test_attempts to authenticated;
grant insert (id, user_id, test_id, started_at) on public.mock_test_attempts to authenticated;

-- The candidate may declare that they have handed in, and how long they took.
-- `combined_band` and `status = 'scored'` are not theirs to set — see migration 004.
grant update (submitted_at, elapsed_seconds) on public.mock_test_attempts to authenticated;

-- ── Handing in ────────────────────────────────────────────────────────────────
--
-- The candidate is granted `submitted_at` but not `status`, so the two could drift.
-- This trigger keeps them in step: writing a hand-in time *is* handing in. Moving to
-- 'scored' is not done here — that happens when both tasks finish scoring (migration
-- 004), which is a fact about the marking, not about the candidate.

create or replace function public.mock_attempt_mark_submitted()
returns trigger
language plpgsql
as $$
begin
  if new.submitted_at is not null and old.status = 'in_progress' then
    new.status := 'submitted';
  end if;
  return new;
end;
$$;

create trigger mock_test_attempts_mark_submitted
  before update on public.mock_test_attempts
  for each row execute function public.mock_attempt_mark_submitted();
