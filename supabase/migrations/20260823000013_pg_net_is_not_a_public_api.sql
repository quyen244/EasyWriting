-- Keep pg_net out of reach of a user token.
--
-- `20260823000010` installs pg_net with a bare `create extension if not exists pg_net`,
-- which places it wherever the connection's search_path puts it. On this project that
-- path is `"$user", public, extensions` and there is no `postgres` schema, so the
-- landing spot is decided by pg_net's own script rather than by anything this repo
-- states — and one of the possible outcomes is `public`.
--
-- That outcome matters. `public` is an exposed Data API schema (config.toml `[api]
-- schemas`), and a freshly created function carries EXECUTE for PUBLIC unless something
-- takes it away. pg_net in `public` therefore means any learner's JWT can POST
-- `/rest/v1/rpc/http_post` with a URL of their choosing: outbound requests from inside
-- the project's network, billed to it, aimed at whatever they like. That is a
-- server-side request forgery hole opened by an extension nobody meant to expose.
--
-- The dispatcher is unaffected — `dispatch_grading` is SECURITY DEFINER and owned by
-- `postgres`, so it keeps its own access no matter what the callable roles lose here.
--
-- Written to hold in every case rather than in the one case observed: it walks
-- pg_net's actual dependency list, so it is correct whether the extension landed in
-- `net`, `extensions` or `public`, and a no-op where the reach never existed.

do $$
declare
  obj record;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    return;
  end if;

  -- Functions: the SSRF surface. `regprocedure` renders a schema-qualified signature,
  -- so overloads are handled and no name is assumed.
  for obj in
    select p.oid::regprocedure::text as sig
      from pg_depend d
      join pg_extension e on e.oid = d.refobjid and e.extname = 'pg_net'
      join pg_proc p      on p.oid = d.objid
     where d.deptype = 'e' and d.classid = 'pg_proc'::regclass
  loop
    execute format('revoke all on function %s from public, anon, authenticated', obj.sig);
  end loop;

  -- Tables: `http_request_queue` and `_http_response`. Less dramatic than the
  -- functions, but the response table holds the bodies of everything the project has
  -- fetched, and readable-by-default is not a decision anyone made here.
  for obj in
    select c.oid::regclass::text as rel
      from pg_depend d
      join pg_extension e on e.oid = d.refobjid and e.extname = 'pg_net'
      join pg_class c     on c.oid = d.objid
     where d.deptype = 'e' and d.classid = 'pg_class'::regclass
       and c.relkind in ('r', 'p', 'v', 'm')
  loop
    execute format('revoke all on table %s from public, anon, authenticated', obj.rel);
  end loop;
end $$;
