# Implementation Plan: IELTS Writing Score Assessment & Explainability

> **STALE — 2026-08-21.** Written against the retired FastAPI backend and the four-call
> criterion-by-criterion pipeline. `spec.md` was rewritten for the mock-test grader; this
> file has not been regenerated yet. Run `/speckit-plan` and `/speckit-tasks` to replace it.
> See [../README.md](../README.md).

**Branch**: `001-ielts-score-assessment` | **Date**: 2026-08-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-ielts-score-assessment/spec.md`

## Summary

A learner submits an IELTS Writing essay (Task 1 or Task 2) and receives, within 60 seconds, an
overall band score plus a band score and rubric-grounded, evidence-quoting explanation for each
of the four IELTS criteria. Technical approach: a FastAPI backend runs a trimmed, concurrent
version of the existing IE AI Evaluator scoring pipeline (4 criterion-evaluator LLM calls via
OpenRouter, down from its original 6) against PostgreSQL-persisted submissions. Scoring
methodology (prompts/model/params) is captured in versioned YAML and benchmarked against a
migrated golden dataset per Constitution Principle IV before any change ships.

**This feature is backend-only.** It ships the assessments API plus a thin
`frontend/src/lib/apiClient.ts` for `002-core-app-ux` to consume — no pages or UI components are
built here. `/speckit-analyze` flagged (finding I1) that building a full essay-submission page
against the old placeholder mockup would have been discarded the moment `002`'s real,
Stitch-generated design landed; the workspace UI is now built exactly once, entirely within
`002`, against this feature's stable, independently-tested API.

## Technical Context

**Language/Version**: Backend: Python 3.12. Frontend: TypeScript 5.x on Node.js 20 LTS (Next.js).

**Primary Dependencies**: Backend: FastAPI, SQLAlchemy 2.x, Alembic, psycopg (PostgreSQL driver),
Pydantic v2 + pydantic-settings, httpx (OpenRouter REST calls, OpenAI-compatible), PyYAML
(pipeline config), pytest. Frontend: Next.js (App Router), React, Tailwind CSS, TypeScript — this
feature only scaffolds the frontend project and its API client; it adds no pages or components.

**Storage**: PostgreSQL for submissions, assessment results, and users. Local, version-controlled
filesystem (not DB) for the golden dataset, YAML pipeline configs, and JSON benchmark run reports
— these are audit/methodology artifacts per Constitution Principle IV, not application data.

**Testing**: Backend: pytest — unit tests for deterministic aggregation/verification logic,
contract tests for the assessments API, and a `FakeClient` LLM test double (reusing the IE AI
Evaluator pattern) for deterministic offline pipeline tests. Golden-dataset regression harness for
any scoring-methodology change (Constitution Principle IV). This feature ships no frontend UI, so
no Vitest/Playwright suite is introduced here — validated instead via `curl`/API calls per
[quickstart.md](./quickstart.md); `002-core-app-ux` owns the frontend test suite for the pages
that consume this API.

**Target Platform**: Backend: Docker container run on a local machine, exposed publicly via
Cloudflare Tunnel (`cloudflared`) on `rexsantech.com`. Frontend: Vercel.

**Project Type**: Web application (frontend + backend).

**Performance Goals**: Full scored result (overall + 4 criteria + explanations) returned within
60 seconds for at least 95% of submissions (SC-001).

**Constraints**: At most 4 LLM calls per assessment (Constitution Principle V — down from the
reused pipeline's original 6). All services dockerized (Constitution Principle VII). No learner
essay data shared beyond what the OpenRouter scoring call requires.

**Scale/Scope**: Solo-maintained SaaS in early validation; single local backend instance behind
one Cloudflare Tunnel. Low tens of concurrent learners expected initially — no horizontal-scale
design needed yet.

**Note — auth dependency**: This feature requires an authenticated learner (FR-008) but account
creation/sign-in itself is out of scope for this spec (see spec Assumptions). This plan assumes a
session/JWT-issuing auth mechanism is available as a shared prerequisite for the essay-submission
endpoint; if it does not yet exist elsewhere in the project, standing up minimal auth is a
blocking dependency tracked outside this feature.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design — see below.*

| Principle | Gate | Status |
|---|---|---|
| I. Rubric-Grounded, Explainable Scoring | Every score ships with a criterion-level explanation citing descriptor language (FR-004, FR-012); no bare scores | PASS |
| II. Teach-to-Improve Guidance | N/A — this feature is scoring/explanation only; rewriting guidance is explicitly out of scope (spec Assumptions) | N/A (deferred to a future feature) |
| III. Test-First Development | Contract + unit tests written before implementation; offline `FakeClient` enables red-green cycles without live LLM calls | PASS |
| IV. Evaluation-Driven Methodology Changes | Golden dataset (migrated from IE AI Evaluator) + versioned YAML pipeline config + JSON result artifacts required before any prompt/model change ships | PASS |
| V. Cost-Conscious LLM Usage | Trimmed from 6 to 4 LLM calls per assessment; model is an OpenRouter config value, never hardcoded | PASS |
| VI. Simplicity & Reusable Design | Reuses existing `LLMClient` Protocol and pipeline stages as-is; criterion scores stored as JSONB, not a new normalized table, since nothing in scope queries them independently; builds zero frontend UI to avoid duplicate work with `002-core-app-ux` (`/speckit-analyze` finding I1) | PASS |
| VII. Observability, Error Handling & Security | Structured logging + error handling on the assessments endpoint; backend-owned auth gate; dockerized services; essay data scoped to evaluation use only | PASS |

No violations — Complexity Tracking table omitted.

**Post-Phase-1 re-check**: data-model.md's JSONB-embedded `CriterionScore` (no new table) and
the added `pipelines/*.yaml` convention were the only structural decisions made during design;
both were justified in [research.md](./research.md) (decisions 4 and 5) directly against
Principles VI and IV respectively. No new violations introduced — all rows above still PASS/N/A.

## Project Structure

### Documentation (this feature)

```text
specs/001-ielts-score-assessment/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   └── assessments-openapi.yaml
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── core/                    # config.py (pydantic-settings), schemas.py (Pydantic models)
│   ├── domain/                  # entities, interfaces, exceptions
│   ├── llm/
│   │   ├── base.py              # LLMClient Protocol + LLMResponse
│   │   ├── openrouter_client.py # sole LLM adapter for this feature (Constitution V)
│   │   ├── prompts/             # prompt builders per criterion
│   │   └── rubrics/             # versioned IELTS band-descriptor text (Constitution I)
│   ├── pipeline/
│   │   ├── pipeline.py          # trimmed EvaluationPipeline: preprocess → 4 concurrent criterion
│   │   │                        # evaluators → deterministic aggregate/verify
│   │   ├── aggregate.py         # band rounding, length penalty (code, not LLM judgement)
│   │   ├── preprocess.py
│   │   └── verify.py            # quote-fidelity check against the source essay
│   ├── evaluation/
│   │   ├── dataset.py           # golden dataset load/write
│   │   ├── harness.py           # benchmark runner (Constitution IV)
│   │   └── metrics.py           # MAE/RMSE/Spearman vs. gold labels
│   ├── infrastructure/database/ # SQLAlchemy models, Alembic migrations, repository
│   └── api/                     # FastAPI routers (assessments, health)
├── pipelines/                   # versioned YAML pipeline configs (prompt/model/params)
├── data/
│   ├── golden/                  # golden dataset essays + gold labels (migrated from IE AI Evaluator)
│   └── reports/<run_id>/        # raw_results.json, metrics.json per benchmark run
├── tests/
│   ├── contract/
│   ├── integration/
│   └── unit/
└── Dockerfile

frontend/
├── src/
│   └── lib/                     # apiClient.ts — API client for the assessments endpoint.
│                                  # This feature adds no app/ pages or components/ — the
│                                  # workspace UI that calls this client is built entirely by
│                                  # 002-core-app-ux (see Summary and Constitution Check VI).
└── Dockerfile
```

**Structure Decision**: Web application split (frontend/ + backend/), per Constitution's fixed
stack (Next.js/Vercel frontend, FastAPI/Postgres backend). Backend layout carries over the
layered structure (`core/domain/llm/pipeline/evaluation/infrastructure/api`) proven in the IE AI
Evaluator project, trimmed to what this feature needs; a `pipelines/` YAML directory is new, added
to satisfy Constitution Principle IV, which the prior project did not have. The frontend side of
this split is intentionally minimal — a scaffold and an API client only — because this feature's
job is to prove the scoring API works, not to build the UI that will consume it.

## Complexity Tracking

*No Constitution Check violations — table intentionally omitted.*
