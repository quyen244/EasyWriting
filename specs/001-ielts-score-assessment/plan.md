# Implementation Plan: WriteWise Grader — Single-Task IELTS Writing Assessment

**Branch**: `001-ielts-score-assessment` | **Date**: 2026-08-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-ielts-score-assessment/spec.md`

## Summary

A signed-in learner submits one piece of IELTS Writing (Task 1 or Task 2, with an optional exam
prompt) and receives, within about a minute, a band and a bilingual comment for each of the four
official criteria plus an overall band — with every result traceable to the exact prompt and model
that produced it. The primary technical move is consolidating the inherited four-call-per-criterion
pipeline into a single model call whose only job is judgement (four bands, four comments); every
other number in the result — the overall band, the length-under deduction, the display labels — is
derived deterministically in code, never asked of the model (spec.md AD-1).

This is graded as a **new, versioned pipeline methodology** (`pipeline-v2.0`, research.md R2) rather
than an edit to the existing `pipeline-v1.0`, so the mandatory before/after golden-set comparison
(constitution Principle IV) has something concrete to compare against. The grading function is a
Supabase Edge Function — Tier 1 per the constitution's compute model — so the frontend's only server
dependency remains Supabase (Principle VIII), leaving the roadmap's planned ASR/Speaking feature as
a second consumer of the same architecture rather than a new integration surface.

## Technical Context

**Language/Version**: TypeScript on Deno (Supabase Edge Functions runtime) for the grading
function; SQL for schema/policies; Python 3 (existing `eval/` toolchain, unchanged) for the golden-
set benchmark harness.

**Primary Dependencies**: `supabase-js` (frontend, to invoke the function and to read
`grader_results` directly); no new runtime dependency inside the Edge Function itself — the
OpenRouter call is a plain `fetch`, matching the constitution's "model-agnostic interface... via
OpenRouter" without adding an SDK for a single HTTP call.

**Storage**: Supabase Postgres — `grader_results`, `llm_calls` (data-model.md).

**Testing**: `deno test` for the function's pure logic (gate, feature extraction, band snapping,
length penalty, aggregation) and a fake-LLM-client integration path (research.md R6); pgTAP via
`supabase test db` for RLS policies and column grants (research.md R5); the existing `eval/`
`pytest` suite, extended to benchmark `pipeline-v2.0` against the golden set (research.md R2).

**Target Platform**: Supabase Edge Functions (Deno, globally distributed, serverless) + Supabase
Postgres. No servers to provision; no Docker for this feature (Tier 1 workload).

**Project Type**: Backend-as-a-Service extension — a single Supabase Edge Function plus a schema
migration. Not the template's "web application" split; there is no new `backend/` directory, and no
UI is built in this feature (spec.md §3 — the grader page's visual design is an explicit non-goal).

**Performance Goals**: SC-001 — a complete result within 60 seconds for at least 95% of
submissions. One model call per submission is itself the primary lever for staying inside that
budget (a quarter of the inherited pipeline's calls).

**Constraints**: Exactly one LLM call per graded submission (FR-006, constitution Principle V); the
model never performs counting or arithmetic (AD-1); the length-deduction/prompt-instruction pairing
must move together or every under-length learner is penalised twice (§9's warning, tested per
research.md R6).

**Scale/Scope**: Same solo-maintained SaaS scale as the rest of this project — low submission
volume initially, cost-bounded by FR-028's rate limit (default: 20/hour/learner, research.md R4)
rather than by infrastructure capacity.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design below.*

| Principle | Gate | Status |
|---|---|---|
| I. Rubric-Grounded, Explainable Scoring | Every band ships with a descriptor-grounded comment (FR-013..FR-016) | **PASS** — satisfied in full for this feature; see TP-1 note below |
| II. Teach-to-Improve Guidance | N/A — explicit non-goal (spec.md §3) | **N/A** |
| III. Test-First Development | RLS policies and column grants have owner-can/other-cannot tests (research.md R5); pure aggregation/gate logic is unit-tested before the handler is built around it (research.md R6) | **PASS** |
| IV. Evaluation-Driven Methodology Changes | The four-call → one-call change ships as a new versioned pipeline (`v2`) benchmarked against `v1` on the golden set before being treated as production's methodology of record (research.md R2, quickstart.md) | **PASS** |
| V. Cost-Conscious LLM Usage | One call per submission (FR-006); model/params from versioned config, not hardcoded; per-user rate limit (FR-028, research.md R4); every call's cost recorded (FR-027) | **PASS** |
| VI. Simplicity & Reusable Design | No new compute tier introduced (stays Tier 1); no shared cross-runtime prompt package built preemptively (research.md R3); rate limiting uses a plain count query, not a new subsystem (research.md R4) | **PASS** |
| VII. Observability, Error Handling & Security by Default | RLS + column-level revokes enforce authorization in the database (data-model.md); `llm_calls` records every call's cost/latency/outcome/raw response; `raw_response` has a stated purge posture (data-model.md Retention) | **PASS** |
| VIII. Database-Mediated Compute | The frontend's only server dependency is Supabase; the grading function is invoked via `supabase.functions.invoke()`, and the row it writes is what a future asynchronous dispatch or a Tier 2 worker would consume without changing this table's shape | **PASS** |

**TP-1 note**: constitution v3.1.0 narrowed TP-1 specifically because this feature closes Principle
I in full for the grader (bilingual, descriptor-grounded, per-criterion comments). What TP-1 still
covers — project-wide, not blocking this feature — is machine-verified evidence anchoring (comments
are not programmatically checked as exact quotations from the essay) and the not-yet-specified
mock-test feature. Neither is a gap in *this* feature's compliance; both are named explicitly so
they aren't forgotten.

No unjustified violations. **Complexity Tracking is empty** — nothing here required a deviation.

## Project Structure

### Documentation (this feature)

```text
specs/001-ielts-score-assessment/
├── plan.md                        # This file
├── research.md                    # Phase 0 — R1..R8
├── data-model.md                  # Phase 1 — grader_results, llm_calls, state machine
├── contracts/
│   └── grade-task-openapi.yaml    # Phase 1 — the grade-task wire contract
├── quickstart.md                  # Phase 1 — validation guide per user story
└── tasks.md                       # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
supabase/
├── functions/
│   └── grade-task/
│       ├── index.ts               # request handler — orchestrates the 8 steps of spec.md §6
│       ├── gate.ts                # scoreability gate (§9) — ported from eval/src/pipeline/preprocess.py
│       ├── extract.ts             # feature extraction (§9) — word/sentence/paragraph counts, devices
│       ├── aggregate.ts           # band snapping, length penalty, overall aggregation (AD-1, AD-3)
│       │                          #   — ported from eval/src/pipeline/aggregate.py
│       ├── prompt.ts              # builds the single consolidated prompt from prompts/v2/*
│       ├── openrouter.ts          # the one model call + one retry (research.md R8)
│       ├── prompts/               # deployed copy of eval/prompts/v2/ (research.md R3)
│       └── grade-task.test.ts     # deno test — exercises gate.ts/aggregate.ts/extract.ts directly
│
├── migrations/
│   └── <timestamp>_grader_results.sql   # tables, RLS, column revokes, unique index, check constraints
│
└── tests/
    └── grader_results_rls.sql     # pgTAP — research.md R5

eval/
├── prompts/
│   └── v2/                        # NEW — canonical single-call prompt (research.md R2, R3)
│       ├── system.txt
│       └── user.txt               # requests all 4 criteria + comments in one response
├── pipelines/
│   └── v2.yaml                    # NEW — same model config as v1.yaml, prompts.version: v2
└── src/pipeline/
    └── pipeline.py                # MODIFIED — gains a single-call orchestration mode to benchmark v2
```

**Structure Decision**: No `backend/` directory is created or reused — the constitution retired the
self-hosted backend, and this feature's compute is entirely Tier 1 (Supabase Edge Functions). The
existing `frontend/` tree is untouched by this plan: this feature's contract (§8/§12,
contracts/grade-task-openapi.yaml) is what a future grader-UI feature will consume, but building
that UI is explicitly out of scope (spec.md §3). `eval/` gains a new pipeline version rather than a
modified one, per research.md R2, so the methodology change required by Principle IV has a real
before/after artifact instead of an in-place edit with nothing to compare against.

## Complexity Tracking

*No entries — Constitution Check above passed without requiring a deviation.*

---

## Post-Design Constitution Re-Check

Re-evaluated after Phase 1 (data-model.md, contracts/, quickstart.md):

- **III (Test-First)**: data-model.md's completeness check constraint and column revokes are
  concrete, testable objects now (not just a stated intent) — pgTAP tests in research.md R5 assert
  against them directly. **Still PASS.**
- **IV (Evaluation-Driven)**: quickstart.md's hypothesis-test section makes the `v1` vs `v2`
  comparison a concrete, runnable step, not just a plan-level intention. **Still PASS.**
- **VII (Observability)**: data-model.md's Retention section commits to a purge posture for
  `raw_response` rather than leaving retention unstated. **Still PASS.**
- **VIII (Database-Mediated Compute)**: contracts/grade-task-openapi.yaml confirms the only
  endpoint this feature exposes is the Supabase Edge Function itself — no second compute surface
  was introduced during design. **Still PASS.**

No new violations surfaced during design. Ready for `/speckit-tasks`.
