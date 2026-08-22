-- Progress and activity: derived, never stored.
--
-- Neither of these is an entity (CLARIFICATION.md §2.1). "What is my average band" and
-- "what have I been doing" are questions about the attempts already in the database. A
-- stored copy would be a cache, and a stale cache is how a dashboard comes to report 6.5
-- above a list of essays averaging 6.8.
--
-- Both read through the caller's own RLS, so neither can leak across accounts.

-- ── Activity ──────────────────────────────────────────────────────────────────

create view public.v_activity
with (security_invoker = true)
as
  select
    'graded'::text                        as kind,
    w.id::text                            as id,
    w.scored_at                           as at,
    '/results/' || w.id::text             as href,
    w.user_id,
    w.task_type,
    null::text                            as module_id,
    w.overall_band                        as band
  from public.writing_attempts w
  where w.status = 'scored' and w.source = 'grader'

  union all

  select
    'mock_test',
    m.id::text,
    m.submitted_at,
    -- Opens the sitting's Task 1 result; the result screen links across to Task 2.
    coalesce(
      '/results/' || (
        select w.id::text from public.writing_attempts w
        where w.mock_attempt_id = m.id
        order by w.task_type
        limit 1
      ),
      '/mock-test/writing'
    ),
    m.user_id,
    null,
    null,
    m.combined_band
  from public.mock_test_attempts m
  where m.status = 'scored'

  union all

  select
    'practice',
    p.id::text,
    p.created_at,
    '/practice/writing/' || p.module_id,
    p.user_id,
    md.task_type,
    p.module_id,
    null
  from public.practice_attempts p
  join public.practice_modules md on md.id = p.module_id;

comment on view public.v_activity is
  'One stream across grading, mock tests and practice. Derived — nothing writes here.';

-- ── Progress ──────────────────────────────────────────────────────────────────
--
-- Returns the `ProgressSummary` shape the account screen is already built against, as a
-- single round trip. Every figure comes from the same scored attempts the history list
-- shows, which is what makes it impossible for the two to disagree.

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
-- Every criterion band from every attempt, flattened.
criterion_bands as (
  select e ->> 'code' as code, (e ->> 'band')::numeric as band
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
  'ProgressSummary for the calling learner, derived from their scored attempts.';

grant select  on public.v_activity            to authenticated;
grant execute on function public.get_progress_summary() to authenticated;
