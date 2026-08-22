-- Access-control tests.
--
-- The claims these make are the ones the product cannot afford to be wrong about: that a
-- learner reads only their own work, and that nobody can award themselves a band. Both
-- are enforced by policies and grants rather than by application code, so both have to be
-- tested against a real Postgres — a passing TypeScript suite says nothing about either.
--
--   psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql
--
-- Everything runs inside one transaction and is rolled back, so the file can be run
-- against a seeded database as many times as you like without leaving anything behind.

\set ON_ERROR_STOP on
\timing off

begin;

-- ── Helpers ───────────────────────────────────────────────────────────────────

create function pg_temp.assert_that(assertion boolean, what text)
returns void language plpgsql as $$
begin
  if assertion then
    raise notice '  ok    %', what;
  else
    raise exception 'FAILED: %', what;
  end if;
end;
$$;

/**
 * Runs a statement that MUST be refused, and fails loudly if it succeeds.
 *
 * Only privilege and constraint errors count as a pass. A syntax error would otherwise
 * masquerade as working security, which is the one way a test like this can lie.
 */
create function pg_temp.denied(stmt text, what text)
returns void language plpgsql as $$
declare
  allowed boolean := false;
begin
  begin
    execute stmt;
    allowed := true;
  exception
    when insufficient_privilege or check_violation or raise_exception then
      null;
  end;

  if allowed then
    raise exception 'SECURITY FAILURE: % was permitted', what;
  end if;
  raise notice '  ok    refused: %', what;
end;
$$;

-- ── Two learners ──────────────────────────────────────────────────────────────

\set alice '11111111-1111-1111-1111-111111111111'
\set bob   '22222222-2222-2222-2222-222222222222'

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        created_at, updated_at, raw_user_meta_data)
values
  (:'alice', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'alice@writewise.test', 'x', now(), now(), '{"full_name": "Alice Nguyen"}'),
  (:'bob',   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'bob@writewise.test',   'x', now(), now(), '{}');

\echo '── profiles: created by trigger, owned by one person ──'

select pg_temp.assert_that(
  (select count(*) from public.profiles where id in (:'alice', :'bob')) = 2,
  'sign-up creates exactly one profile per user');

select pg_temp.assert_that(
  (select full_name from public.profiles where id = :'alice') = 'Alice Nguyen',
  'full_name comes from the sign-up metadata');

select pg_temp.assert_that(
  (select full_name from public.profiles where id = :'bob') = 'bob',
  'a learner who gave no name falls back to the email local part');

select set_config('request.jwt.claims',
  json_build_object('sub', :'alice', 'role', 'authenticated')::text, true);
set local role authenticated;

select pg_temp.assert_that(
  (select count(*) from public.profiles) = 1,
  'a learner sees only their own profile');

select pg_temp.denied(
  format('update public.profiles set email = %L where id = %L', 'hijack@x.test', :'alice'),
  'changing your own email column');

update public.profiles set full_name = 'Alice N.' where id = :'alice';
select pg_temp.assert_that(
  (select full_name from public.profiles where id = :'alice') = 'Alice N.',
  'a learner may rename themselves');

reset role;

-- ── writing_attempts: the table that must not be writable ─────────────────────

\echo '── writing_attempts: ownership and the score columns ──'

select set_config('request.jwt.claims',
  json_build_object('sub', :'alice', 'role', 'authenticated')::text, true);
set local role authenticated;

insert into public.writing_attempts (id, user_id, task_type, essay_text, word_count, min_words)
values ('aaaaaaaa-0000-0000-0000-000000000001', :'alice', 'TASK_2',
        'Some people believe working from home benefits everyone involved.', 260, 250);

select pg_temp.assert_that(
  (select status from public.writing_attempts
    where id = 'aaaaaaaa-0000-0000-0000-000000000001') = 'queued',
  'a new submission starts queued, which is what a dispatcher looks for');

select pg_temp.denied(
  format($f$insert into public.writing_attempts
            (user_id, task_type, essay_text, word_count, min_words)
          values (%L, 'TASK_2', 'not mine', 300, 250)$f$, :'bob'),
  'submitting work under another learner''s id');

select pg_temp.denied(
  $f$update public.writing_attempts set overall_band = 9.0$f$,
  'awarding yourself a band');

select pg_temp.denied(
  $f$update public.writing_attempts set status = 'scored'$f$,
  'marking your own work as scored');

select set_config('request.jwt.claims',
  json_build_object('sub', :'bob', 'role', 'authenticated')::text, true);
set local role authenticated;

select pg_temp.assert_that(
  (select count(*) from public.writing_attempts) = 0,
  'a learner cannot read another learner''s attempts');

select pg_temp.assert_that(
  (select count(*) from public.v_activity) = 0,
  'the activity view does not leak across accounts');

select pg_temp.denied(
  $f$select count(*) from public.llm_calls$f$,
  'reading the model-call log');

reset role;

-- ── The constraints that keep a stored result honest ──────────────────────────

\echo '── scored rows must be complete and bilingual ──'

select pg_temp.denied(
  $f$update public.writing_attempts
       set status = 'scored', overall_band = 7.0
     where id = 'aaaaaaaa-0000-0000-0000-000000000001'$f$,
  'a scored row with no criteria');

-- The frontend's older spelling of the fourth criterion.
select pg_temp.denied(
  $f$update public.writing_attempts set status = 'scored', overall_band = 7.0,
       pipeline_version = 'pipeline-v2.0', model_id = 'm', scored_at = now(),
       criteria = '[{"code":"TASK_RESPONSE","band":7,"comment":{"en":"a","vi":"a"}},
                    {"code":"COHERENCE_COHESION","band":7,"comment":{"en":"a","vi":"a"}},
                    {"code":"LEXICAL_RESOURCE","band":7,"comment":{"en":"a","vi":"a"}},
                    {"code":"GRAMMATICAL_RANGE","band":7,"comment":{"en":"a","vi":"a"}}]'::jsonb
     where id = 'aaaaaaaa-0000-0000-0000-000000000001'$f$,
  'criteria using an unrecognised criterion code');

select pg_temp.denied(
  $f$update public.writing_attempts set status = 'scored', overall_band = 7.0,
       pipeline_version = 'pipeline-v2.0', model_id = 'm', scored_at = now(),
       criteria = '[{"code":"TASK_RESPONSE","band":7,"comment":{"en":"a"}},
                    {"code":"COHERENCE_COHESION","band":7,"comment":{"en":"a","vi":"a"}},
                    {"code":"LEXICAL_RESOURCE","band":7,"comment":{"en":"a","vi":"a"}},
                    {"code":"GRAMMATICAL_RANGE_ACCURACY","band":7,"comment":{"en":"a","vi":"a"}}]'::jsonb
     where id = 'aaaaaaaa-0000-0000-0000-000000000001'$f$,
  'a result that exists in only one language');

select pg_temp.denied(
  $f$update public.writing_attempts set status = 'scored', overall_band = 6.7,
       pipeline_version = 'pipeline-v2.0', model_id = 'm', scored_at = now(),
       criteria = '[{"code":"TASK_RESPONSE","band":6.7,"comment":{"en":"a","vi":"a"}},
                    {"code":"COHERENCE_COHESION","band":7,"comment":{"en":"a","vi":"a"}},
                    {"code":"LEXICAL_RESOURCE","band":7,"comment":{"en":"a","vi":"a"}},
                    {"code":"GRAMMATICAL_RANGE_ACCURACY","band":7,"comment":{"en":"a","vi":"a"}}]'::jsonb
     where id = 'aaaaaaaa-0000-0000-0000-000000000001'$f$,
  'a band off the half-band grid');

-- The marker, running as service_role, can do what the learner cannot.
update public.writing_attempts
   set status = 'scored', overall_band = 7.0, scored_at = now(),
       pipeline_version = 'pipeline-v2.0', prompt_version = 'v2', model_id = 'nemotron',
       criteria = '[{"code":"TASK_RESPONSE","band":7,"comment":{"en":"a","vi":"a"}},
                    {"code":"COHERENCE_COHESION","band":7,"comment":{"en":"a","vi":"a"}},
                    {"code":"LEXICAL_RESOURCE","band":7.5,"comment":{"en":"a","vi":"a"}},
                    {"code":"GRAMMATICAL_RANGE_ACCURACY","band":6.5,"comment":{"en":"a","vi":"a"}}]'::jsonb
 where id = 'aaaaaaaa-0000-0000-0000-000000000001';

select pg_temp.assert_that(
  (select overall_band from public.writing_attempts
    where id = 'aaaaaaaa-0000-0000-0000-000000000001') = 7.0,
  'a complete result from the marker is accepted');

-- ── The combined band for a sitting ───────────────────────────────────────────

\echo '── mock test: Task 1 once, Task 2 twice ──'

select set_config('request.jwt.claims',
  json_build_object('sub', :'alice', 'role', 'authenticated')::text, true);
set local role authenticated;

insert into public.mock_test_attempts (id, user_id, test_id)
values ('bbbbbbbb-0000-0000-0000-000000000001', :'alice', 'mock_writing_01');

insert into public.writing_attempts
  (id, user_id, source, mock_attempt_id, task_type, essay_text, word_count, min_words)
values
  ('aaaaaaaa-0000-0000-0000-000000000002', :'alice', 'mock_test',
   'bbbbbbbb-0000-0000-0000-000000000001', 'TASK_1', 'The line graph shows commuting.', 160, 150),
  ('aaaaaaaa-0000-0000-0000-000000000003', :'alice', 'mock_test',
   'bbbbbbbb-0000-0000-0000-000000000001', 'TASK_2', 'Congestion has many causes.', 270, 250);

-- Handing in is the candidate's to declare; the trigger keeps `status` in step.
update public.mock_test_attempts
   set submitted_at = now(), elapsed_seconds = 3400
 where id = 'bbbbbbbb-0000-0000-0000-000000000001';

select pg_temp.assert_that(
  (select status from public.mock_test_attempts
    where id = 'bbbbbbbb-0000-0000-0000-000000000001') = 'submitted',
  'writing a hand-in time is handing in');

reset role;

update public.writing_attempts
   set status = 'scored', overall_band = 6.0, scored_at = now(),
       pipeline_version = 'p', model_id = 'm',
       criteria = '[{"code":"TASK_ACHIEVEMENT","band":6,"comment":{"en":"a","vi":"a"}},
                    {"code":"COHERENCE_COHESION","band":6,"comment":{"en":"a","vi":"a"}},
                    {"code":"LEXICAL_RESOURCE","band":6,"comment":{"en":"a","vi":"a"}},
                    {"code":"GRAMMATICAL_RANGE_ACCURACY","band":6,"comment":{"en":"a","vi":"a"}}]'::jsonb
 where id = 'aaaaaaaa-0000-0000-0000-000000000002';

select pg_temp.assert_that(
  (select combined_band from public.mock_test_attempts
    where id = 'bbbbbbbb-0000-0000-0000-000000000001') is null,
  'no combined band until both halves are marked');

update public.writing_attempts
   set status = 'scored', overall_band = 7.0, scored_at = now(),
       pipeline_version = 'p', model_id = 'm',
       criteria = '[{"code":"TASK_RESPONSE","band":7,"comment":{"en":"a","vi":"a"}},
                    {"code":"COHERENCE_COHESION","band":7,"comment":{"en":"a","vi":"a"}},
                    {"code":"LEXICAL_RESOURCE","band":7,"comment":{"en":"a","vi":"a"}},
                    {"code":"GRAMMATICAL_RANGE_ACCURACY","band":7,"comment":{"en":"a","vi":"a"}}]'::jsonb
 where id = 'aaaaaaaa-0000-0000-0000-000000000003';

-- (6.0 + 7.0 x 2) / 3 = 6.667 -> 6.5 on the half-band grid.
select pg_temp.assert_that(
  (select combined_band from public.mock_test_attempts
    where id = 'bbbbbbbb-0000-0000-0000-000000000001') = 6.5,
  'Task 2 is weighted double and the result lands on a half band');

select pg_temp.assert_that(
  (select status from public.mock_test_attempts
    where id = 'bbbbbbbb-0000-0000-0000-000000000001') = 'scored',
  'the sitting is marked scored once both tasks are');

-- ── Derived figures agree with the rows they come from ────────────────────────

\echo '── progress and practice: derived, never stored ──'

select set_config('request.jwt.claims',
  json_build_object('sub', :'alice', 'role', 'authenticated')::text, true);
set local role authenticated;

select pg_temp.assert_that(
  (select (public.get_progress_summary() ->> 'total_submissions')::int) = 3,
  'progress counts exactly the scored attempts');

-- The assertion that matters: the dashboard cannot contradict the list beside it.
select pg_temp.assert_that(
  (select (public.get_progress_summary() ->> 'overall_average')::numeric)
    = (select round(avg(overall_band), 2) from public.writing_attempts
        where user_id = :'alice' and status = 'scored'),
  'the headline average equals the average of the history rows');

-- Pinning behaviour that is currently a hazard, not a feature.
--
-- TASK_ACHIEVEMENT scores 6.00 here off a SINGLE Task 1, while
-- GRAMMATICAL_RANGE_ACCURACY scores 6.50 across three essays. The lower mean wins, so a
-- learner is told their weakest area is the one they have the least evidence for — and
-- the practice hand-off then sends them there.
--
-- Worse, TASK_ACHIEVEMENT and TASK_RESPONSE are mutually exclusive: one only ever comes
-- from Task 1 and the other only from Task 2, so ranking all five against each other
-- compares criteria drawn from different exams.
--
-- Asserted as-is so the behaviour is deliberate and visible rather than discovered later
-- by a learner. See TODO.md: this needs a product decision (minimum sample size, or rank
-- only the three shared criteria).
select pg_temp.assert_that(
  (select public.get_progress_summary() -> 'weakest' ->> 'code') = 'TASK_ACHIEVEMENT',
  'weakest is the lowest mean, even on a sample of one');

select pg_temp.assert_that(
  (select (public.get_progress_summary() -> 'weakest' ->> 'sample_size')::int) = 1,
  'the weakest criterion here rests on one essay — the number the UI must not hide');

select pg_temp.assert_that(
  (select public.get_progress_summary() -> 'strongest' ->> 'code') = 'TASK_RESPONSE',
  'strongest is the highest mean');

insert into public.practice_attempts (user_id, exercise_id, module_id, answer)
values (:'alice', 't1_pi_1', 't1_paraphrase_introduction', 'A first go.'),
       (:'alice', 't1_pi_1', 't1_paraphrase_introduction', 'A second go.'),
       (:'alice', 't1_pi_2', 't1_paraphrase_introduction', 'Another exercise.');

select pg_temp.assert_that(
  (select completed_count from public.v_practice_progress
    where user_id = :'alice' and module_id = 't1_paraphrase_introduction') = 2,
  'progress counts exercises attempted, not attempts made');

select pg_temp.assert_that(
  (select exercise_count from public.v_practice_progress
    where user_id = :'alice' and module_id = 't1_paraphrase_introduction') = 3,
  'progress knows how many exercises the module has');

select set_config('request.jwt.claims',
  json_build_object('sub', :'bob', 'role', 'authenticated')::text, true);
set local role authenticated;
select pg_temp.assert_that(
  (select count(*) from public.v_practice_progress) = 0,
  'practice progress does not leak across accounts');

reset role;

\echo ''
\echo 'All access-control assertions passed.'

rollback;
