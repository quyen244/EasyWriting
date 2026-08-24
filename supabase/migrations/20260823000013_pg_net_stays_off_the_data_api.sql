-- Fail the deploy if pg_net ever becomes callable through the Data API.
--
-- `20260823000010` installs pg_net with a bare `create extension if not exists pg_net`,
-- which leaves the landing schema to the extension's own script rather than to anything
-- this repo states. That looked like a hole worth patching, so this file first tried to
-- be a patch. It could not be one, for two reasons, both measured on a fresh
-- `supabase db reset`:
--
--   1. There is nothing to patch. `pg_extension.extnamespace` reads `public`, but the
--      script creates its own `net` schema and puts every function there. PostgREST
--      exposes `public` and `graphql_public` only (config.toml `[api] schemas`), so
--      `POST /rest/v1/rpc/http_post` answers 404 PGRST202 — the function is not in a
--      schema the API can see. `extra_search_path` does not change that: it affects name
--      resolution inside a request, not which schemas are exposed.
--   2. A patch here could not work anyway. pg_net's objects are owned by
--      `supabase_admin` and migrations run as `postgres`, so `revoke` from a non-owner
--      without grant option raises a WARNING and changes nothing. Verified: every
--      pg_net function still returned `has_function_privilege('authenticated', …) = t`
--      after the revoke ran.
--
-- So what is left is the part that has real value: the reasoning above is true of
-- pg_net *today*, on this Postgres image, and nothing in this repo pins it. If a future
-- version installs into `public` instead, the project silently gains an authenticated
-- SSRF endpoint — outbound requests from inside the project, aimed anywhere, billed
-- here. This raises instead, at deploy time, where it is cheap to notice.
--
-- Reading catalogs needs no ownership, which is exactly why the check can live where
-- the fix could not.

do $$
declare
  exposed text[] := array['public', 'graphql_public'];  -- config.toml [api] schemas
  leaked  text;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    return;
  end if;

  select string_agg(p.oid::regprocedure::text, ', ' order by p.oid::regprocedure::text)
    into leaked
    from pg_depend d
    join pg_extension e on e.oid = d.refobjid and e.extname = 'pg_net'
    join pg_proc p      on p.oid = d.objid
    join pg_namespace n on n.oid = p.pronamespace
   where d.deptype = 'e'
     and d.classid = 'pg_proc'::regclass
     and n.nspname = any (exposed)
     and (has_function_privilege('anon', p.oid, 'execute')
          or has_function_privilege('authenticated', p.oid, 'execute'));

  if leaked is not null then
    raise exception
      'pg_net is reachable from the Data API: %. A learner JWT could POST /rest/v1/rpc '
      'with any URL. Reinstall it outside the exposed schemas (create extension pg_net '
      'with schema extensions) before deploying.', leaked;
  end if;
end $$;
