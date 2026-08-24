-- Upper bounds on the text a submission may carry.
--
-- `20260823000004` checks that `essay_text` is non-empty and nothing else. There was no
-- ceiling anywhere — not in the database, not in the editor. Every submitted character
-- is sent to the model four times (once per criterion), so an unbounded field is an
-- unbounded bill: the rate limit added in `0011` caps submissions per hour, but twenty
-- one-megabyte submissions is still twenty megabytes of prompt.
--
-- The numbers are generous on purpose. A Task 2 essay is 250–400 words; 20,000
-- characters is roughly 3,000 words, far past anything a real candidate writes under
-- exam conditions and far short of anything that costs real money. This is a bound on
-- abuse, not a writing constraint, and it should never be the thing a learner meets.
--
-- Enforced as CHECK constraints rather than in the Edge Function: by the time the
-- function sees the row, the text is already stored, and storage is the other half of
-- what an unbounded field costs.

alter table public.writing_attempts
  add constraint essay_text_has_a_ceiling
    check (length(essay_text) <= 20000),

  -- The exam prompt is one paragraph. Task 1's chart description is a few sentences.
  -- Both are pasted rather than written, which is exactly why they need a bound.
  add constraint prompt_text_has_a_ceiling
    check (prompt_text is null or length(prompt_text) <= 5000),
  add constraint chart_description_has_a_ceiling
    check (chart_description is null or length(chart_description) <= 5000),

  -- The three Task 1 parts are joined into essay_text, so they are bounded by the same
  -- reasoning. Checked individually because the join happens in the client, and a
  -- constraint that only holds if the client behaves is not a constraint.
  add constraint task1_parts_have_a_ceiling
    check (
      coalesce(length(task1_introduction), 0)
      + coalesce(length(task1_overview), 0)
      + coalesce(length(task1_body), 0) <= 20000
    );

comment on constraint essay_text_has_a_ceiling on public.writing_attempts is
  'Roughly 3,000 words. A bound on cost and abuse, not on writing — a real candidate '
  'should never come near it.';
