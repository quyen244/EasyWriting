-- How a queued attempt reaches the marker.
--
-- Constitution VIII: the client never calls compute. It inserts a row with
-- `status = 'queued'` and watches that row; everything below is what turns that insert
-- into a request to the `grade-attempt` Edge Function. The learner's session is not on
-- the critical path, so closing the laptop does not cancel the marking.
--
-- Two mechanisms, because one is not enough:
--
--   1. An AFTER INSERT trigger fires `pg_net.http_post` immediately. This is the fast
--      path and handles essentially every submission.
--   2. A per-minute cron sweep re-dispatches anything the trigger dropped. This is NOT
--      optional. `pg_net` is fire-and-forget: it queues the request and returns without
--      waiting, so a request that never arrives leaves no error anywhere — the row just
--      sits in `queued` forever and the learner watches a spinner. The sweeper is the
--      only thing that notices.
--
-- Secrets live in Vault, never here. See the bottom of this file for the three
-- `vault.create_secret` calls an operator runs once per environment.

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- ── Dispatch bookkeeping ──────────────────────────────────────────────────────
--
-- Two columns the learner cannot write (they are absent from the INSERT grant, like
-- every other column only the marker touches). Without them the sweeper cannot tell a
-- row it dispatched ten seconds ago from one abandoned five minutes ago, and cannot
-- stop retrying a row that fails every time.

alter table public.writing_attempts
  add column if not exists dispatch_attempts int not null default 0,
  add column if not exists dispatched_at     timestamptz;

comment on column public.writing_attempts.dispatch_attempts is
  'How many times this attempt has been handed to the marker. Bounds sweeper retries.';

-- Past this, a row that is still unfinished is presumed lost rather than slow.
-- Generous on purpose: four concurrent model calls with a repair retry each can take
-- well over a minute, and re-dispatching a job that is merely slow would pay for it
-- twice. The claim-by-status update in the Edge Function makes a duplicate dispatch
-- harmless, not free.
create or replace function public.grading_dispatch_grace()
returns interval language sql immutable as $$ select interval '5 minutes' $$;

-- Three strikes. A row failing this consistently is failing for a reason retrying will
-- not fix, and a learner is better served by an error they can act on than by a
-- spinner that never resolves.
create or replace function public.grading_max_dispatches()
returns int language sql immutable as $$ select 3 $$;

-- ── The dispatcher ────────────────────────────────────────────────────────────

create or replace function public.dispatch_grading(attempt_id uuid)
returns void
language plpgsql
security definer
-- `net` and `extensions` both appear because pg_net's functions live in one or the
-- other depending on how the extension was installed, and this migration should not
-- care which. `http_post` is therefore called unqualified.
set search_path = public, extensions, net
as $$
declare
  fn_url    text;
  fn_secret text;
  fn_auth   text;
begin
  select decrypted_secret into fn_url
    from vault.decrypted_secrets where name = 'grade_attempt_url';
  select decrypted_secret into fn_secret
    from vault.decrypted_secrets where name = 'grade_attempt_secret';
  select decrypted_secret into fn_auth
    from vault.decrypted_secrets where name = 'grade_attempt_auth';

  if fn_url is null or fn_secret is null or fn_auth is null then
    -- Deliberately NOT an exception: raising here would abort the learner's INSERT and
    -- lose their essay over a deployment misconfiguration. The row stays queued, the
    -- warning reaches the logs, and the sweeper retries once the secrets exist.
    raise warning 'dispatch_grading: vault secrets missing, attempt % left queued', attempt_id;
    return;
  end if;

  update public.writing_attempts
     set dispatch_attempts = dispatch_attempts + 1,
         dispatched_at     = now()
   where id = attempt_id;

  perform http_post(
    url     := fn_url,
    headers := jsonb_build_object(
                 'Content-Type',   'application/json',
                 -- The function verifies a JWT (Supabase gatekeeping) AND this shared
                 -- secret. The JWT alone is not enough: a learner's own token passes it.
                 'Authorization',  'Bearer ' || fn_auth,
                 'x-grade-secret', fn_secret
               ),
    body    := jsonb_build_object('attempt_id', attempt_id),
    -- The post only needs to be ACCEPTED, not answered: marking takes far longer than
    -- this and completes independently of this connection. Sized for a cold start
    -- rather than a warm one — measured locally, a cold worker took over 5s to boot and
    -- a 5s timeout aborted the delivery before the function had read the request, which
    -- left the row queued and looked exactly like a network failure.
    timeout_milliseconds := 20000
  );
end;
$$;

comment on function public.dispatch_grading is
  'Hands one queued attempt to the grade-attempt Edge Function. Never raises: a failed '
  'dispatch must not roll back the learner''s submission.';

-- ── The fast path ─────────────────────────────────────────────────────────────

create or replace function public.writing_attempts_dispatch()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'queued' then
    perform public.dispatch_grading(new.id);
  end if;
  return new;
end;
$$;

create trigger writing_attempts_dispatch_grading
  after insert on public.writing_attempts
  for each row execute function public.writing_attempts_dispatch();

-- ── The safety net ────────────────────────────────────────────────────────────

create or replace function public.sweep_stuck_attempts()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  grace   interval := public.grading_dispatch_grace();
  ceiling int      := public.grading_max_dispatches();
  swept   int      := 0;
  row     record;
begin
  -- Rows the marker claimed but never finished: it crashed, timed out, or was evicted
  -- mid-run. Back to the queue so something picks them up.
  update public.writing_attempts
     set status = 'queued'
   where status = 'scoring'
     and dispatched_at < now() - grace
     and dispatch_attempts < ceiling;

  -- Rows that have used up their retries. Ending them is kinder than a spinner that
  -- never resolves, and `error_code` is what the UI turns into an explanation.
  update public.writing_attempts
     set status = 'failed', error_code = 'DISPATCH_EXHAUSTED'
   where status in ('queued', 'scoring')
     and dispatch_attempts >= ceiling
     and dispatched_at < now() - grace;

  -- Everything still waiting, including what was just requeued above. `dispatched_at
  -- is null` catches the case this whole function exists for: the trigger ran but the
  -- request never left, so nothing was ever recorded against the row.
  --
  -- Reads through writing_attempts_pending_idx, the partial index created alongside the
  -- table specifically for this query.
  for row in
    select id from public.writing_attempts
     where status = 'queued'
       and dispatch_attempts < ceiling
       and (dispatched_at is null or dispatched_at < now() - grace)
     order by created_at
     limit 50
  loop
    perform public.dispatch_grading(row.id);
    swept := swept + 1;
  end loop;

  if swept > 0 then
    raise log 'sweep_stuck_attempts: re-dispatched % attempt(s)', swept;
  end if;
  return swept;
end;
$$;

comment on function public.sweep_stuck_attempts is
  'Re-dispatches attempts the AFTER INSERT trigger failed to deliver. pg_net is '
  'fire-and-forget, so without this a dropped request leaves a row queued forever.';

-- ── Access ────────────────────────────────────────────────────────────────────
--
-- All three are SECURITY DEFINER and none is callable from a user token. A learner able
-- to call `dispatch_grading` could spend the model budget in a loop; one able to call
-- the sweeper could re-mark other people's attempts.

-- The marker's own grants, which did not exist until something actually ran as
-- service_role. `auto_expose_new_tables` is off for this project (see config.toml), so
-- a new table is reachable by NO Data API role until it is granted explicitly — and
-- 20260823000004/000005 granted `authenticated` deliberately and service_role not at
-- all. RLS was never the thing standing in the way: service_role bypasses RLS but is
-- still subject to table privileges, so the Edge Function got "permission denied for
-- table writing_attempts" on its very first claim.
--
-- Narrow on purpose. UPDATE and SELECT are what marking a row needs; INSERT is not,
-- because a learner creates the row and the marker only ever fills it in. DELETE is
-- not, because nothing server-side should be able to make an attempt disappear.
grant select, update on public.writing_attempts to service_role;

-- Append-only, and the marker never reads it back — but SELECT rides along with
-- INSERT ... returning, which supabase-js issues by default.
grant select, insert on public.llm_calls to service_role;

revoke all on function public.dispatch_grading(uuid)     from public, anon, authenticated;
revoke all on function public.sweep_stuck_attempts()     from public, anon, authenticated;
revoke all on function public.writing_attempts_dispatch() from public, anon, authenticated;

-- ── Schedule ──────────────────────────────────────────────────────────────────
--
-- Every minute. The sweep is a cheap indexed read that normally finds nothing, and a
-- longer interval is time a learner spends staring at a spinner for no reason.

select cron.unschedule('sweep-stuck-writing-attempts')
 where exists (select 1 from cron.job where jobname = 'sweep-stuck-writing-attempts');

select cron.schedule(
  'sweep-stuck-writing-attempts',
  '* * * * *',
  $$ select public.sweep_stuck_attempts() $$
);

-- ── Operator setup (run once per environment, never committed) ────────────────
--
-- These carry real secrets, so they are documented rather than executed here:
--
--   select vault.create_secret(
--     'https://<project-ref>.supabase.co/functions/v1/grade-attempt', 'grade_attempt_url');
--   select vault.create_secret('<a long random string>',  'grade_attempt_secret');
--   select vault.create_secret('<service_role key>',      'grade_attempt_auth');
--
-- The same random string must be set as the function's GRADE_ATTEMPT_SECRET, alongside
-- OPENROUTER_API_KEY:
--
--   supabase secrets set GRADE_ATTEMPT_SECRET=<same string> OPENROUTER_API_KEY=<key>
--
-- Until all three exist, submissions stay queued and dispatch_grading logs a warning
-- every minute — visible, and recoverable the moment the secrets are set.
