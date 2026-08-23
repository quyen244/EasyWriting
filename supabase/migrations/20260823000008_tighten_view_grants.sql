-- Take back the blanket grants Supabase hands out on anything created in `public`.
--
-- Every table in this schema is explicitly revoked and re-granted, but the two views
-- were left on Supabase's default, which is ALL to both `anon` and `authenticated` —
-- including INSERT, UPDATE, DELETE and TRUNCATE.
--
-- Probing the live API showed nothing leaking today, for two reasons that are both
-- accidents rather than decisions:
--
--   * both views are `security_invoker = true`, so an anonymous reader is stopped one
--     level down by the base tables having no grant for `anon`; and
--   * neither view is auto-updatable — v_activity is a UNION, v_practice_progress
--     aggregates — so a write through them errors out in the planner.
--
-- Neither reason is a policy. Grant `anon` SELECT on any base table, or rewrite
-- v_practice_progress as a plain projection, and the write path opens with no migration
-- anywhere near it. The grant should say what we mean instead.

revoke all on public.v_activity from anon, authenticated;
revoke all on public.v_practice_progress from anon, authenticated;

-- Read-only, signed-in only. The row filtering is still the base tables' RLS, reached
-- through security_invoker; this only decides who may ask the question at all.
grant select on public.v_activity to authenticated;
grant select on public.v_practice_progress to authenticated;
