# Phase 1 Data Model: WriteWise Grader

The tables below are the concrete form of [spec.md](./spec.md) §13, expanded with validation rules,
relationships, and the state machine `status` drives. Both tables live in Supabase Postgres,
created by a migration in `supabase/migrations/`.

## Account (`auth.users`, extended by `profiles`)

Prerequisite entity, owned by the Supabase platform feature (see
[../README.md](../README.md) for the status of the retired `003-account-authentication` feature
whose requirements carried forward). Referenced here only by foreign key — this feature does not
modify `auth.users` or `profiles`.

## GraderResult (`grader_results`)

One assessed task: the input, the deterministic features measured from it, its job state, and —
once scored — its bands and comments.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `auth.users.id` | required; owner for RLS (FR-025) |
| `source` | text | `'grader'` \| `'mock_test'`; default `'grader'` — see Relationships |
| `task_type` | text | `'TASK_1'` \| `'TASK_2'`; required (FR-001, FR-002) |
| `prompt_text` | text, nullable | optional per §8 / the grader page's "Không bắt buộc" field |
| `essay_text` | text | required, non-empty; preserved through failure (FR-019) |
| `word_count` | int | computed at gate time (FR-008, FR-011) |
| `min_words` | int | snapshot of the task's minimum at scoring time — 150 or 250 |
| `length_penalty` | numeric(2,1) | `0`, `0.5`, or `1.0` (FR-009); shown to the learner (FR-012) |
| `status` | text | `'queued'` \| `'scoring'` \| `'scored'` \| `'failed'` \| `'rejected'` — see State Transitions |
| `error_code` | text, nullable | set only when `status` is `'failed'` or `'rejected'` |
| `overall_band` | numeric(2,1), nullable | mean of four criterion bands, rounded (FR-004, FR-005) |
| `criteria` | jsonb, nullable | array of exactly 4 `CriterionResult` objects — see below |
| `pipeline_version` | text, nullable | `"pipeline-v2.0"` once scored (FR-024) |
| `prompt_version` | text, nullable | `"v2"` once scored |
| `model_id` | text, nullable | OpenRouter model id actually used |
| `created_at` | timestamptz | |
| `scored_at` | timestamptz, nullable | set when `status` becomes `'scored'` |

**`criteria` shape** (matches spec.md §12's Criterion result table):

```jsonc
[
  { "code": "TASK_RESPONSE",              "label": "Task Response",              "band": 6.5, "comment": "…" },
  { "code": "COHERENCE_COHESION",          "label": "Coherence and Cohesion",     "band": 6.0, "comment": "…" },
  { "code": "LEXICAL_RESOURCE",            "label": "Lexical Resource",           "band": 6.5, "comment": "…" },
  { "code": "GRAMMATICAL_RANGE_ACCURACY",  "label": "Grammatical Range and Accuracy", "band": 6.0, "comment": "…" }
]
```

Position 1's `code`/`label` is `TASK_ACHIEVEMENT`/"Task Achievement" when `task_type = 'TASK_1'`,
and `TASK_RESPONSE`/"Task Response" when `task_type = 'TASK_2'` (FR-032, §7). Positions 2–4 are
identical across task types. Order is always fixed — never sorted by band or re-ordered.

**Validation rules**:

- `task_type` MUST be one of the two supported values (FR-002).
- `essay_text` MUST be non-empty; the gate rejects empty/near-empty input before a row reaches
  `'scoring'` (FR-021).
- `word_count` MUST be ≥ 0; `min_words` MUST equal the task type's official minimum at the time of
  scoring (150 for `TASK_1`, 250 for `TASK_2`).
- `length_penalty` MUST be exactly `0`, `0.5`, or `1.0` — no other value is derivable from FR-009's
  thresholds.
- `overall_band`, when present, MUST be within `[1, 9]` and on the 0.5 grid (FR-005, FR-017).
- `criteria`, when present, MUST contain exactly 4 elements, each with a `code` from the fixed set,
  a `band` within `[1, 9]` on the 0.5 grid, and a non-empty `comment` (FR-013, FR-016, FR-018).
- **A `'scored'` row MUST be complete**: `overall_band`, `criteria` (all 4 elements),
  `pipeline_version`, and `model_id` all present. Enforced by a table check constraint, not by
  application discipline alone (FR-018, AD-8) — an incomplete result is a database error, not a
  storable state.
- **Score-bearing columns cannot be set by the owner directly.** `overall_band`, `criteria`,
  `status`, `error_code`, `length_penalty`, `pipeline_version`, `prompt_version`, and `model_id` are
  revoked from the `authenticated` role at the column level (FR-026). Only the grading function,
  running with elevated privileges, writes them.

**Relationships**:

- `user_id` → `auth.users.id`. A learner reads only rows where `user_id = auth.uid()` (RLS).
- `source` distinguishes this feature's direct submissions (`'grader'`) from rows the future
  mock-test feature will create (`'mock_test'`) when it reuses this same pipeline instead of
  re-implementing it (spec.md §17). This feature only ever writes `'grader'`; the column exists now
  so the mock test's later migration needs no backfill.

## State Transitions

```
                    ┌──────────────┐
   gate fails ─────▶│  rejected    │  terminal. error_code set. zero model calls made.
                    └──────────────┘

   gate passes
        │
        ▼
   ┌──────────┐   model call    ┌─────────┐   parses, 4 criteria   ┌──────────┐
   │ queued   │ ───────────────▶│ scoring │ ───────────────────────▶│  scored  │  terminal
   └──────────┘  (same request) └─────────┘                        └──────────┘
                                     │
                                     │ model call fails, or output
                                     │ invalid after one retry
                                     ▼
                                ┌──────────┐
                                │  failed  │  terminal. error_code set.
                                └──────────┘  essay_text untouched — retry
                                              creates a NEW row via a new request.
```

`queued` and `scoring` are transient — in this feature's synchronous flow (AD-7), a single request
handler carries a row from insert through to `scored`/`failed` without another caller observing the
intermediate states except via a page reload (User Story 1 scenario 3's "in-progress" state is the
client's own optimistic UI while the request is outstanding, not a poll of `status`). The states are
still modeled explicitly — not collapsed into a boolean — because `queued`/`scoring` are exactly
what the partial unique index (research.md R4) keys on, and are what a future asynchronous dispatch
(constitution Principle VIII, if this pipeline ever moves to Tier 2) would drive from the outside
without changing the shape of this table.

**Only forward transitions exist.** No transition returns a row to an earlier state; a retry after
`failed` is a new row, not a mutated one — this is what keeps FR-023 ("a stored result MUST be
readable later and identical to what was first shown") true without a version/history mechanism.

## LLMCall (`llm_calls`)

A durable, append-only record of one call to the grading model — audit and cost evidence, never
shown to a learner directly (constitution Principle VII).

| Field | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `grader_result_id` | uuid, FK → `grader_results.id`, nullable | null when the call preceded a row, or the row's own insert failed |
| `user_id` | uuid, FK → `auth.users.id`, nullable | |
| `pipeline_version` | text | required — `"pipeline-v2.0"` |
| `prompt_version` | text | required — `"v2"` |
| `model_id` | text | required |
| `status` | text | `'ok'` \| `'parse_error'` \| `'timeout'` \| `'rate_limited'` \| `'http_error'` |
| `latency_ms` | int, nullable | |
| `prompt_tokens` | int, nullable | |
| `completion_tokens` | int, nullable | |
| `cost_usd` | numeric(10,6), nullable | |
| `retry_count` | int | default 0; at most 1 per §11/R8 |
| `bands_coerced` | boolean | true if any returned band needed snapping (FR-017) |
| `raw_response` | jsonb, nullable | purged on a schedule — contains the learner's essay via the prompt |
| `error_message` | text, nullable | |
| `created_at` | timestamptz | |

**Validation rules**:

- Exactly one row per model call attempt — a retry (R8) produces a **second** `llm_calls` row, not
  an update to the first, so both attempts remain visible for debugging (FR-027).
- `status = 'ok'` rows are the ones counted toward SC-012's cost-per-submission visibility.
- No RLS policy is defined on this table — it has no policy at all, meaning only `service_role`
  (which bypasses RLS entirely) can read or write it. A learner's client, using the `anon`/session
  key, gets zero rows regardless of query.

**Relationships**:

- `grader_result_id` → `grader_results.id`, nullable specifically so a failed call whose owning row
  never reached `'scored'` — or whose insert itself failed — is still captured (the case FR-027
  calls "the record most worth keeping").

## Retention (constitution Principle VII)

- `grader_results.essay_text` and `prompt_text`: kept as long as the learner's history is useful to
  them; no automatic purge in this feature's baseline (the learner's own submissions, under their
  own RLS-scoped access).
- `llm_calls.raw_response`: contains the essay text embedded in the prompt sent to the model, and
  MUST be purged on a defined schedule per the constitution's "Raw learner content captured for
  observability MUST be purged on a defined schedule." The remaining columns (tokens, cost,
  latency, status) contain no personal data and are retained indefinitely for trend analysis. The
  exact schedule (e.g., 90 days) is a policy value to set at deployment, not a schema concern.
