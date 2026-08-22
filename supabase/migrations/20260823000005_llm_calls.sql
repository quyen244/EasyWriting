-- Every call to a paid model, recorded.
--
-- Created now even though nothing calls a model yet (CLARIFICATION.md D-8). Adding this
-- table later would mean the first weeks of spending are simply unknown, and the
-- constitution requires every paid call to be recorded and every paid endpoint to be
-- rate-limited (Principles V and VII).
--
-- Append-only, and never shown to a learner: it contains their essay via the prompt.

create table public.llm_calls (
  id                 uuid primary key default gen_random_uuid(),

  -- Null when the call preceded the row, or the row's own insert failed. The record of
  -- the spend survives either way.
  writing_attempt_id uuid references public.writing_attempts (id) on delete set null,
  user_id            uuid references auth.users (id) on delete set null,

  pipeline_version   text not null,
  prompt_version     text not null,
  model_id           text not null,

  status             text not null check (status in (
                       'ok', 'parse_error', 'timeout', 'rate_limited', 'http_error')),

  latency_ms         int,
  prompt_tokens      int,
  completion_tokens  int,
  -- Reasoning tokens are output tokens on this provider and are billed as such. Tracked
  -- separately because they are invisible in the response and were, once, the cause of
  -- every criterion failing — see docs/live-model-validation.md.
  reasoning_tokens   int,
  cost_usd           numeric(10,6),

  retry_count        int not null default 0,
  -- True when a returned band had to be snapped onto the half-band grid. A rising rate
  -- here means the prompt is drifting, not that the learners changed.
  bands_coerced      boolean not null default false,

  raw_response       jsonb,

  created_at         timestamptz not null default now()
);

create index llm_calls_attempt_idx on public.llm_calls (writing_attempt_id);
create index llm_calls_created_idx on public.llm_calls (created_at desc);

-- ── Access ────────────────────────────────────────────────────────────────────
--
-- No policies and no grants: not readable, not writable, not visible to any user token.
-- RLS with zero policies denies everyone; service_role bypasses it. That is the whole
-- intended access model.

alter table public.llm_calls enable row level security;
revoke all on public.llm_calls from anon, authenticated;

comment on table public.llm_calls is
  'Cost and audit evidence. service_role only — contains learner text via the prompt.';
