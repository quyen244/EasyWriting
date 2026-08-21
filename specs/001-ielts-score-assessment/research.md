# Phase 0 Research: IELTS Writing Score Assessment & Explainability

> **STALE — 2026-08-21.** Written against the retired FastAPI backend and the four-call
> criterion-by-criterion pipeline. `spec.md` was rewritten for the mock-test grader; this
> file has not been regenerated yet. Run `/speckit-plan` and `/speckit-tasks` to replace it.
> See [../README.md](../README.md).

All Technical Context unknowns are resolved by decisions below; none required external
survey-of-the-art research since the constitution fixes the stack and a working reference
pipeline (IE AI Evaluator) already exists to evaluate and adapt.

## 1. Backend stack

**Decision**: Python 3.12, FastAPI, SQLAlchemy 2.x + Alembic, PostgreSQL (via `psycopg`).

**Rationale**: The constitution fixes this stack. The IE AI Evaluator project already has a
working FastAPI app, SQLAlchemy models, and one Alembic migration on this exact stack — reusing
it is strictly cheaper than introducing a new one.

**Alternatives considered**: None — stack is a constitutional constraint, not an open choice.

## 2. LLM access

**Decision**: Keep the existing `LLMClient` Protocol abstraction; implement only the
`openrouter_client.py` adapter for this feature. Drop the Ollama adapter.

**Rationale**: Constitution Principle V requires LLM calls to go through OpenRouter behind a
model-agnostic interface with the model as a config value. The Protocol already provides that
abstraction without new design. Ollama existed in the source project for local/offline model
runs; it's not needed now that OpenRouter is the sanctioned path, and the existing `FakeClient`
test double already covers offline/deterministic testing without a real local model.

**Alternatives considered**: Keep the Ollama adapter for local dev — rejected as unused
complexity (Constitution VI); nothing in this feature's scope calls for a second live provider.

## 3. Trimming the pipeline to 4 LLM calls

**Decision**: Run only the 4 criterion evaluators (Task Achievement/Response, Coherence &
Cohesion, Lexical Resource, Grammatical Range & Accuracy) per assessment. Skip the source
pipeline's sentence-corrector and feedback-synthesizer steps.

**Rationale**: Those two steps produce rewritten sentences and synthesized feedback prose, which
belong to the teach-to-improve guidance feature (Constitution Principle II) — explicitly out of
scope here per the spec's Assumptions. The criterion evaluators already return quoted evidence
from the essay (needed for FR-004's explanation requirement and for the existing quote-fidelity
verification step), so nothing needed for *this* feature's explainability is lost. Dropping 2 of
6 calls is a direct, measurable instance of Constitution Principle V (cost-conscious LLM usage)
with no quality tradeoff for the score itself.

**Alternatives considered**: Run all 6 steps now and simply not surface the extra output —
rejected: spends LLM budget on output nobody sees yet, which is both a Principle V violation and
speculative building-ahead (Principle VI).

## 4. Per-criterion score storage

**Decision**: Store the four criterion scores as a JSONB array column on the assessment result
row (`criteria`), each element holding `{criterion, band, explanation, evidence_quotes[],
descriptor_reference}`. No separate `criterion_scores` table.

**Rationale**: There are always exactly four, fixed at creation time, and nothing in this
feature's scope queries or updates a single criterion score independently of its parent
assessment. The source project already uses this exact pattern (`Score.criteria_json`)
successfully. A normalized child table is unjustified complexity today (Constitution VI).

**Alternatives considered**: Normalized `criterion_scores` table — would be justified if a future
feature (e.g. the dashboard, showing "your Lexical Resource trend over time") needs to query
criterion scores across many assessments; deferred until that need is concrete.

## 5. Methodology config-as-code

**Decision**: Add a `backend/pipelines/*.yaml` convention (prompt text/version, model id,
temperature and other params) that the pipeline loads at runtime. Reuse the source project's
`data/reports/<run_id>/{raw_results.json,metrics.json}` JSON convention as-is for benchmark
output.

**Rationale**: Constitution Principle IV explicitly requires a versioned YAML pipeline config and
JSON result storage; the source project had neither (config lived only in Python `Settings`).
This is new work required to satisfy the constitution, layered on top of the otherwise-reused
pipeline code.

**Alternatives considered**: Keep config in `Settings`/env vars only — rejected, does not satisfy
Principle IV's explicit YAML requirement or support the before/after hypothesis-test workflow.

## 6. Golden dataset

**Decision**: Migrate the existing labeled essays (`data/exams/task1/*.json`,
`data/exams/task2/*.json` — 5 per task, each with a `gold` block: overall band + per-criterion
bands, source, confidence) into this project's `backend/data/golden/` as the starting golden set,
grown over time.

**Rationale**: These are already human-labeled and directly usable for SC-002's benchmarking
requirement; relabeling from scratch would duplicate existing work for no benefit.

**Alternatives considered**: None — reuse is strictly better here.

## 7. Auth gate

**Decision**: The assessments endpoint requires an authenticated learner (FR-008), enforced via a
FastAPI dependency, reusing the source project's `User` SQLAlchemy model as a starting schema —
built here as `Account` (not `User` or `Learner`), the canonical name used across this project's
specs (data-model.md, `/speckit-analyze` finding I2). Building the actual sign-up/sign-in flow is
out of this feature's scope (per spec Assumptions) and is a shared prerequisite tracked
separately.

**Rationale**: Matches Constitution Principle VII ("auth/authz is owned and enforced by the
backend") and FR-008, without pulling a whole auth feature into this plan.

**Alternatives considered**: Design full auth here — rejected; the spec explicitly scoped it out,
and building it speculatively inside this feature would violate Principle VI.

## 8. Frontend scope: scaffold + API client only, no UI

**Decision**: This feature initializes the frontend project (Next.js App Router + TypeScript +
Tailwind CSS) and a thin `frontend/src/lib/apiClient.ts`, and builds **no pages or components**.
No design system is ported here at all.

**Rationale**: This spec was planned before any real UI design existed for the product, and its
own quickstart already validates the feature entirely via direct API calls (`curl`), never a
browser — so a UI was never load-bearing for proving this feature works. Building one anyway
against a placeholder mockup would only get discarded the moment a real design landed, which is
exactly what happened: `002-core-app-ux` was later specified against real, Stitch-generated
designs (`academic_editorial` design system, product name WriteWise) with a materially different
workspace layout. `/speckit-analyze` caught the resulting duplication risk (finding I1) before
implementation began. Keeping this feature backend-only means the workspace UI is built exactly
once, in `002`, against this feature's already-stable, already-tested API — and the constitution's
design-reference pointer (amended 2026-08-20, v2.0.1) now names `002`'s real design set directly,
so there is no longer a stale reference for this feature to follow in the first place.

**Alternatives considered**: Build a placeholder UI here anyway, to be replaced by `002` later —
rejected as the exact wasted-work scenario `/speckit-analyze` flagged; there is no user-facing or
testing value a placeholder page adds that direct API validation doesn't already provide.

## 9. Concurrency for latency budget

**Decision**: Issue the 4 criterion-evaluator LLM calls concurrently (`asyncio.gather` over an
async OpenRouter client) rather than sequentially as the source pipeline did.

**Rationale**: The four prompts are independent (no criterion's evaluation depends on another's
output), so running them concurrently reduces wall-clock latency toward SC-001's 60-second budget
at zero added LLM spend — the same 4 calls either way.

**Alternatives considered**: Sequential calls (simpler code, matches source pipeline exactly) —
kept as a fallback if empirical latency testing during implementation shows concurrency isn't
needed to hit SC-001; the decision to concurrently dispatch is a performance optimization to
validate, not an irreversible architectural commitment.
