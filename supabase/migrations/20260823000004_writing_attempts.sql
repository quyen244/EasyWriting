-- One assessed piece of writing: the input, the job state, and — once marked — the bands.
--
-- This is both the submission table and the job table. The frontend writes a row with
-- `status = 'queued'` and watches that row change; it never calls a compute endpoint
-- (constitution Principle VIII). Which tier services the row is invisible from here.
--
-- Grader submissions and mock-test submissions share this table (CLARIFICATION.md D-1).
-- A Task 2 essay is marked identically whether it arrived from the workspace or from a
-- timed sitting, and splitting the table would mean two pipelines and two result screens
-- to keep in agreement.
--
-- The existing five-column table is dropped: it cannot store a result.

drop table if exists public.writing_attempts cascade;

-- ── Criterion shape ───────────────────────────────────────────────────────────
--
-- `criteria` is jsonb rather than four child rows (D-3), so a result is written once and
-- read once. That trades away column-level type checking, which this function buys back:
-- an incomplete or mislabelled result is rejected by the database, not merely discouraged
-- in the application.
--
-- Codes follow eval/ and specs/001 — GRAMMATICAL_RANGE_ACCURACY, the official name
-- (D-14). The frontend's shorter spelling is what changes.

create or replace function public.criteria_match_task(criteria jsonb, task text)
returns boolean
language sql
immutable
as $$
  select criteria is null or (
        jsonb_typeof(criteria) = 'array'
    and jsonb_array_length(criteria) = 4
    -- Order is fixed and never sorted by band: the task criterion first, then the three
    -- that are identical across task types.
    and (
      select array_agg(elem ->> 'code' order by ord)
      from jsonb_array_elements(criteria) with ordinality as t (elem, ord)
    ) = case task
          when 'TASK_1' then array[
            'TASK_ACHIEVEMENT', 'COHERENCE_COHESION',
            'LEXICAL_RESOURCE', 'GRAMMATICAL_RANGE_ACCURACY']
          else array[
            'TASK_RESPONSE', 'COHERENCE_COHESION',
            'LEXICAL_RESOURCE', 'GRAMMATICAL_RANGE_ACCURACY']
        end
    and not exists (
      select 1
      from jsonb_array_elements(criteria) as e
      where (e ->> 'band') is null
         or not ((e ->> 'band')::numeric between 1 and 9)
         or ((e ->> 'band')::numeric * 2) <> floor((e ->> 'band')::numeric * 2)
         -- Both languages, always. A result that exists in only one language would show
         -- a learner an empty panel the moment they switch (round 2 decision).
         or coalesce(e #>> '{comment,en}', '') = ''
         or coalesce(e #>> '{comment,vi}', '') = ''
    )
  );
$$;

comment on function public.criteria_match_task is
  'Four criteria, right codes for the task, bands on the half-band grid, bilingual comments.';

-- ── The table ─────────────────────────────────────────────────────────────────

create table public.writing_attempts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,

  -- Reserved for Speaking, which the constitution requires this model to accommodate
  -- without migrating existing attempts. Writing is all that exists today.
  skill              text not null default 'writing' check (skill in ('writing', 'speaking')),

  source             text not null default 'grader' check (source in ('grader', 'mock_test')),
  mock_attempt_id    uuid references public.mock_test_attempts (id) on delete cascade,

  task_type          text not null check (task_type in ('TASK_1', 'TASK_2')),

  -- ── Input ──
  prompt_text        text,
  essay_text         text not null check (length(trim(essay_text)) > 0),

  -- Task 1 is marked as three parts, so it is stored as three parts. `essay_text` above
  -- is the joined form, which is what the word count and the model see.
  task1_introduction text,
  task1_overview     text,
  task1_body         text,

  -- The chart the report is about. The image is stored for the learner to look back at;
  -- it is not read by the model, so `chart_description` is what the mark is based on
  -- (D-4). That limitation is deliberate and recorded.
  chart_description  text,
  chart_image_path   text,

  -- ── Measured at submission ──
  word_count         int not null check (word_count >= 0),
  min_words          int not null check (min_words > 0),

  -- ── Written only by the marker ──
  length_penalty     numeric(2,1) not null default 0 check (length_penalty in (0, 0.5, 1.0)),
  provisional        boolean not null default false,

  status             text not null default 'queued'
                       check (status in ('queued', 'scoring', 'scored', 'failed', 'rejected')),
  error_code         text,

  overall_band       numeric(2,1)
                       check (overall_band is null or (
                         overall_band between 1 and 9
                         and (overall_band * 2) = floor(overall_band * 2)
                       )),
  criteria           jsonb,

  pipeline_version   text,
  prompt_version     text,
  model_id           text,

  created_at         timestamptz not null default now(),
  scored_at          timestamptz,

  -- A scored row is a complete row. An incomplete result is a database error, not a
  -- state the product can find itself in.
  constraint scored_rows_are_complete check (
    status <> 'scored' or (
          overall_band     is not null
      and criteria         is not null
      and pipeline_version is not null
      and model_id         is not null
      and scored_at        is not null
    )
  ),
  constraint criteria_shape check (public.criteria_match_task(criteria, task_type)),

  -- Only the two terminal failure states carry a reason.
  constraint error_code_only_on_failure check (
    (status in ('failed', 'rejected')) = (error_code is not null)
  ),

  -- A mock-test row belongs to a sitting; a grader row does not.
  constraint mock_rows_belong_to_a_sitting check (
    (source = 'mock_test') = (mock_attempt_id is not null)
  ),

  -- Task 1's three parts belong to Task 1.
  constraint task1_parts_only_on_task1 check (
    task_type = 'TASK_1'
    or (task1_introduction is null and task1_overview is null and task1_body is null
        and chart_description is null and chart_image_path is null)
  )
);

-- History reads this way: my attempts, newest first.
create index writing_attempts_user_idx
  on public.writing_attempts (user_id, created_at desc);

-- The sweeper that will pick up rows the dispatcher dropped reads this way. Partial, so
-- it stays small however much history accumulates.
create index writing_attempts_pending_idx
  on public.writing_attempts (created_at)
  where status in ('queued', 'scoring');

create index writing_attempts_mock_idx
  on public.writing_attempts (mock_attempt_id)
  where mock_attempt_id is not null;

-- ── The combined band for a sitting ───────────────────────────────────────────
--
-- Task 1 counts once and Task 2 twice, rounded to the half band — the official
-- weighting. Computed here, when the second task finishes marking, rather than in the
-- client: a number this consequential should not depend on which screen is open.

create or replace function public.mock_attempt_recompute_band()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  scored_tasks int;
  weighted     numeric;
begin
  if new.mock_attempt_id is null or new.status <> 'scored' then
    return new;
  end if;

  select count(*),
         sum(case when task_type = 'TASK_2' then overall_band * 2 else overall_band end) / 3.0
    into scored_tasks, weighted
    from public.writing_attempts
   where mock_attempt_id = new.mock_attempt_id
     and status = 'scored';

  -- Both halves, or the average would be of half an exam.
  if scored_tasks = 2 then
    update public.mock_test_attempts
       set combined_band = round(weighted * 2) / 2,
           status        = 'scored'
     where id = new.mock_attempt_id;
  end if;

  return new;
end;
$$;

create trigger writing_attempts_recompute_mock_band
  after update of status on public.writing_attempts
  for each row execute function public.mock_attempt_recompute_band();

-- ── Access ────────────────────────────────────────────────────────────────────
--
-- The important half of this file.
--
-- A learner inserts their own work and reads their own results. They are granted UPDATE
-- on nothing at all: every score-bearing column — status, overall_band, criteria,
-- length_penalty, error_code, and the provenance columns — is unreachable from a user
-- token. Only the marking function, running as service_role, can write them.
--
-- Without this the product's central claim is worthless: anyone could award themselves
-- a 9.0 with one REST call. Retrying a failed attempt creates a new row, so nothing
-- legitimate needs UPDATE.

alter table public.writing_attempts enable row level security;

create policy "attempts are readable by their owner"
  on public.writing_attempts for select to authenticated
  using (user_id = (select auth.uid()));

create policy "a learner submits their own work"
  on public.writing_attempts for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "a learner may delete their own attempt"
  on public.writing_attempts for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.writing_attempts from anon, authenticated;
grant select, delete on public.writing_attempts to authenticated;
grant insert (
  id, user_id, skill, source, mock_attempt_id, task_type,
  prompt_text, essay_text,
  task1_introduction, task1_overview, task1_body,
  chart_description, chart_image_path,
  word_count, min_words
) on public.writing_attempts to authenticated;

-- ── Realtime ──────────────────────────────────────────────────────────────────
--
-- How the client learns that marking finished. RLS applies to replication too, so a
-- learner is only ever pushed their own rows.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.writing_attempts;
  end if;
end;
$$;
