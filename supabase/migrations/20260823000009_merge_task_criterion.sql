-- Merge TASK_ACHIEVEMENT and TASK_RESPONSE for ranking purposes only.
--
-- Both measure the same underlying thing — how fully the essay answers what the task
-- asked for — just named differently per task type (Task 1 reports data, Task 2 argues
-- a position). Ranking them as five separate criteria meant a learner who had written
-- one Task 1 and three Task 2 essays had exactly one data point for TASK_ACHIEVEMENT and
-- three for GRAMMATICAL_RANGE; a single low Task 1 band could then win "weakest
-- criterion" over a criterion with three times the evidence, and the practice handoff
-- would point the learner at the smallest sample rather than the most reliable signal.
-- Decided 2026-08-23: combine samples under one code rather than excluding either.
--
-- Storage is untouched — writing_attempts.criteria still carries TASK_ACHIEVEMENT on
-- Task 1 rows and TASK_RESPONSE on Task 2 rows, enforced by criteria_match_task(), which
-- is correct: those are the labels the real exam uses per task. The merge happens only
-- where bands get aggregated across attempts.

create or replace function public.get_progress_summary()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
with scored as (
  select id, task_type, overall_band, word_count, created_at, criteria
  from public.writing_attempts
  where user_id = (select auth.uid())
    and status = 'scored'
),
-- Every criterion band from every attempt, flattened, with TASK_ACHIEVEMENT and
-- TASK_RESPONSE folded into one code so their sample sizes combine instead of competing.
criterion_bands as (
  select
    case e ->> 'code'
      when 'TASK_RESPONSE' then 'TASK_ACHIEVEMENT'
      else e ->> 'code'
    end as code,
    (e ->> 'band')::numeric as band
  from scored s, jsonb_array_elements(s.criteria) as e
),
criterion_averages as (
  select code,
         round(avg(band), 2) as average,
         count(*)::int       as sample_size
  from criterion_bands
  group by code
),
-- The latest band against the mean of everything before it. Null until there *is* a
-- before — a "change" computed from one attempt would be an invention.
recent as (
  select
    (select overall_band from scored order by created_at desc limit 1) as latest,
    (select avg(overall_band) from (
       select overall_band from scored order by created_at desc offset 1
     ) as earlier)                                                     as before_that
),
weekly as (
  select date_trunc('week', created_at)::date as week_start,
         sum(word_count)::int                 as words,
         count(*)::int                        as submissions
  from scored
  group by 1
),
-- Any day the learner did anything at all, from all three activities.
active as (
  select distinct at::date as day
  from public.v_activity
  where user_id = (select auth.uid()) and at is not null
)
select jsonb_build_object(
  'overall_average', (select round(avg(overall_band), 2) from scored),
  'task1_average',   (select round(avg(overall_band), 2) from scored where task_type = 'TASK_1'),
  'task2_average',   (select round(avg(overall_band), 2) from scored where task_type = 'TASK_2'),

  'recent_change',   (select case
                               when latest is null or before_that is null then null
                               else round(latest - before_that, 2)
                             end
                      from recent),

  'strongest',       (select jsonb_build_object('code', code, 'average', average, 'sample_size', sample_size)
                      from criterion_averages order by average desc, code limit 1),
  'weakest',         (select jsonb_build_object('code', code, 'average', average, 'sample_size', sample_size)
                      from criterion_averages order by average asc, code limit 1),

  'criterion_averages', coalesce((
    select jsonb_agg(jsonb_build_object(
             'code', code, 'average', average, 'sample_size', sample_size) order by code)
    from criterion_averages), '[]'::jsonb),

  -- Oldest first: a trend is read left to right.
  'band_trend', coalesce((
    select jsonb_agg(jsonb_build_object(
             'date', created_at, 'band', overall_band,
             'task_type', task_type, 'result_id', id) order by created_at)
    from scored), '[]'::jsonb),

  'weekly_volume', coalesce((
    select jsonb_agg(jsonb_build_object(
             'week_start', week_start, 'words', words, 'submissions', submissions)
             order by week_start)
    from weekly), '[]'::jsonb),

  'active_days', coalesce((
    select jsonb_agg(day order by day) from active), '[]'::jsonb),

  'total_words',       (select coalesce(sum(word_count), 0)::int from scored),
  'total_submissions', (select count(*)::int from scored)
);
$$;

comment on function public.get_progress_summary is
  'ProgressSummary for the calling learner. TASK_ACHIEVEMENT and TASK_RESPONSE are '
  'merged into TASK_ACHIEVEMENT when ranked, since Task 1 and Task 2 essays never carry '
  'the same code and ranking them separately starves whichever task the learner writes less.';
