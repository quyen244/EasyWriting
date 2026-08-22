-- Practice: twelve drills, three exercises each, and what a learner did with them.
--
-- Same split as the mock test. Instruction text — what to do, what a good answer does —
-- is interface copy and exists in both locales. The material and the model answers stay
-- English, because English is what is being practised.

-- ── Content ───────────────────────────────────────────────────────────────────

create table public.practice_modules (
  id          text primary key,
  task_type   text not null check (task_type in ('TASK_1', 'TASK_2')),
  title       jsonb not null,
  description jsonb not null,
  intro       jsonb not null,
  difficulty  text not null check (difficulty in ('foundation', 'intermediate', 'advanced')),

  -- The criteria this drill trains. This is the field that makes the hand-off from a
  -- result work: when a learner's weakest criterion is Grammatical Range, "practise your
  -- weak area" looks for a module for the same task that trains it. Wrong values here
  -- send someone to the wrong drill, which is worse than offering nothing.
  trains      text[] not null check (
                cardinality(trains) > 0
                and trains <@ array[
                  'TASK_ACHIEVEMENT', 'TASK_RESPONSE', 'COHERENCE_COHESION',
                  'LEXICAL_RESOURCE', 'GRAMMATICAL_RANGE_ACCURACY'
                ]::text[]
              ),

  position    int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.practice_exercises (
  id           text primary key,
  module_id    text not null references public.practice_modules (id) on delete cascade,
  position     int  not null,

  prompt       jsonb not null,   -- what to do (bilingual)
  source       text,             -- what to do it to (English: exam material)
  hints        jsonb not null default '[]'::jsonb,  -- array of bilingual strings
  model_answer text not null,    -- English: the standard being compared against
  feedback     jsonb not null,   -- shown after answering (bilingual)

  unique (module_id, position)
);

create index practice_exercises_module_idx
  on public.practice_exercises (module_id, position);

-- ── What the learner did ──────────────────────────────────────────────────────

create table public.practice_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  exercise_id text not null references public.practice_exercises (id) on delete cascade,

  -- Denormalised from the exercise so progress can be grouped by module without a join,
  -- and so an attempt still says which drill it belonged to if content is reorganised.
  module_id   text not null references public.practice_modules (id) on delete cascade,

  -- Kept, rather than discarded after showing feedback: a drill you cannot look back at
  -- is a drill you cannot learn from twice (CLARIFICATION.md D-7).
  answer      text not null,
  created_at  timestamptz not null default now()
);

create index practice_attempts_user_idx
  on public.practice_attempts (user_id, created_at desc);
create index practice_attempts_progress_idx
  on public.practice_attempts (user_id, module_id, exercise_id);

-- ── Progress ──────────────────────────────────────────────────────────────────
--
-- A view, not a table (CLARIFICATION.md D-6). Progress is the question "how far through
-- this module am I", and the attempts already answer it. A stored counter is a second
-- copy of a derivable fact, and a second copy is something that can be wrong.

create view public.v_practice_progress
with (security_invoker = true)
as
select
  a.user_id,
  m.id                                as module_id,
  count(distinct a.exercise_id)::int  as completed_count,
  (select count(*) from public.practice_exercises e where e.module_id = m.id)::int
                                      as exercise_count,
  max(a.created_at)                   as last_attempt_at
from public.practice_modules m
join public.practice_attempts a on a.module_id = m.id
group by a.user_id, m.id;

comment on view public.v_practice_progress is
  'Derived module progress. security_invoker means the caller''s RLS applies, so a '
  'learner sees only their own rows.';

-- ── Access ────────────────────────────────────────────────────────────────────

alter table public.practice_modules   enable row level security;
alter table public.practice_exercises enable row level security;
alter table public.practice_attempts  enable row level security;

create policy "active modules are readable by any signed-in learner"
  on public.practice_modules for select to authenticated using (is_active);

create policy "exercises of active modules are readable by any signed-in learner"
  on public.practice_exercises for select to authenticated
  using (exists (
    select 1 from public.practice_modules m
    where m.id = practice_exercises.module_id and m.is_active
  ));

create policy "practice attempts are readable by their owner"
  on public.practice_attempts for select to authenticated
  using (user_id = (select auth.uid()));

create policy "a learner records their own practice"
  on public.practice_attempts for insert to authenticated
  with check (user_id = (select auth.uid()));

-- No UPDATE policy. An attempt records what was written at a moment; editing it after
-- seeing the model answer would turn the history into fiction.

create policy "a learner may delete their own practice"
  on public.practice_attempts for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.practice_modules, public.practice_exercises, public.practice_attempts
  from anon, authenticated;

grant select on public.practice_modules, public.practice_exercises to authenticated;
grant select, delete on public.practice_attempts to authenticated;
grant insert (id, user_id, exercise_id, module_id, answer) on public.practice_attempts to authenticated;
grant select on public.v_practice_progress to authenticated;
