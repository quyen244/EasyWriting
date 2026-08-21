# Phase 0 Research: WriteWise Grader

Most architectural decisions were already made and recorded in [spec.md](./spec.md) §18
(Architecture Decisions AD-1..AD-10) during the Phase 1 design discussion with the product owner.
This file resolves the remaining *implementation-level* unknowns — the ones the spec's language
deliberately doesn't dictate a technology for.

## R1. Runtime and repository layout for the grading function

**Decision**: A Supabase Edge Function (Deno + TypeScript), per constitution Tier 1
(`supabase/functions/grade-task/`). Schema lives in `supabase/migrations/`.

**Rationale**: Constitution's Technology & Architecture Constraints name Edge Functions as Tier 1
for exactly this kind of workload — seconds-scale, no GPU, no long-running state. One call at
~10–20s latency fits comfortably inside Deno's request timeout. Tier 2 (a container worker) is
explicitly reserved for work Tier 1 is shown not to fit (Principle VI); nothing about this feature
demonstrates that yet.

**Alternatives considered**: A Next.js Route Handler was the original suggestion earlier in this
project's design conversation, before ASR/Speaking entered the roadmap. It was dropped once a
second compute consumer (ASR) was anticipated — see the constitution's Principle VIII rationale.
Keeping the grading function inside Supabase, not Vercel, means the frontend's only server
dependency is Supabase, and a second consumer (a future ASR function) adds no new secret store, no
new CORS surface, and no frontend change.

## R2. Pipeline versioning: this is a methodology change, not a fresh feature

**Decision**: The single-call pipeline is a **new, versioned methodology** — `pipeline-v2.0` —
sitting alongside the inherited four-call `pipeline-v1.0`, not a silent replacement of it.

- `eval/prompts/v2/` — a new, consolidated prompt requesting all four criteria and their comments
  in one call, adapted from the existing `criterion_system.txt` / `criterion_user.txt` /
  `rubrics/*.txt` (51 lines of rubric text total — small enough to inline for all four criteria at
  once without exceeding a reasonable prompt budget).
- `eval/pipelines/v2.yaml` — same model/temperature/seed values as `v1.yaml` initially (no reason
  to change two variables at once), `prompts.version: v2`, and the same length-penalty thresholds
  (FR-009/FR-010 restate the existing values unchanged).
- `pipeline_version` stored on every `grader_results` row is `"pipeline-v2.0"`.

**Rationale**: Constitution Principle IV requires *"any change to the scoring pipeline... run as a
hypothesis test against the golden dataset before/after"*. Going from four calls to one is exactly
such a change — spec AD-2 states it's a deliberate cost reduction, which is a quality-risk trade-off
that must be measured, not assumed. Versioning it as `v2` rather than editing `v1` in place is what
makes that before/after comparison possible: the harness can run both against the same golden set
and produce two `metrics.json` files to compare (see `eval/data/reports/` for the existing
before/after artifact convention).

This also means **`eval/src/pipeline/pipeline.py`'s orchestration must gain a single-call mode** to
benchmark `v2` — it currently only orchestrates the four-call `asyncio.gather` path. That change is
part of this feature's implementation (it's what makes SC-002 measurable for the pipeline actually
shipped), tracked as implementation work, not deferred.

**Alternatives considered**: Editing `v1.yaml`/`prompts/v1` in place. Rejected — `v1.yaml`'s own
header comment says a prompt-text change requires a new version directory, and silently changing
what a stored `pipeline_version` string means would make every already-scored row's provenance
ambiguous (violates FR-024/FR-034's shape-stability guarantee by the back door).

## R3. Keeping the deployed prompt and the benchmarked prompt identical

**Decision**: `eval/prompts/v2/` is the single canonical source. Before deploying, its files are
copied into `supabase/functions/grade-task/prompts/` (a plain file copy, documented as a manual
step in quickstart.md — not a build pipeline).

**Rationale**: Deno Edge Functions bundle only files inside their own function directory; there is
no cross-directory read at request time, so *some* copy is unavoidable. The risk this creates is
drift — the golden-set benchmark measuring one prompt while production runs a silently different
one, which would make SC-002's "90% within 0.5 bands" claim meaningless. Making the copy step
explicit and named (rather than two hand-maintained originals) is the cheapest mitigation.

**Alternatives considered**: A shared prompt package published to both a Python and a Deno runtime.
Rejected as premature per Principle VI — this is roughly 50 lines of rubric text plus one template;
building cross-runtime package tooling to keep 50 lines in sync costs more than an occasional
manual copy, until the copy step demonstrably causes a drift incident. A CI check that diffs the
two directories is a reasonable next step *when that incident happens*, not before.

## R4. Rate limiting and duplicate-submission prevention (FR-028, FR-029)

**Decision, two mechanisms for two different problems**:

1. **Duplicate/double-click prevention (FR-029)** — a partial unique index:

   ```sql
   create unique index one_active_submission_per_user
     on grader_results (user_id)
     where status in ('queued', 'scoring');
   ```

   A learner can have at most one in-flight submission. A second "Chấm điểm ngay" click while the
   first is still running fails the insert at the database level — no application-level locking,
   no race condition, and it is directly testable (Principle III: insert one row, attempt a second,
   assert the second is rejected).

2. **Throttling repeated use over time (FR-028)** — a count query in the gate step:

   ```sql
   select count(*) from grader_results
   where user_id = $1 and created_at > now() - interval '1 hour';
   ```

   Default threshold: **20 submissions per rolling hour per learner**. This is a planning-level
   default in the sense the Quick Guidelines permit ("make informed guesses... document
   assumptions") — the spec deliberately states the *requirement* (bound how often) without fixing
   a number, since the right number is a cost/product policy knob, not something a technical
   unknown blocks planning on. Recorded here as an assumption; adjustable without a spec change.

**Rationale**: Both are enforced in the database (Principle VIII: dispatch and its guards live
alongside the job row, not in a compute-tier-specific application layer) and both are cheap: no new
table, no external rate-limiter service, and both fit a "make informed guesses, document
assumptions" baseline without inventing infrastructure a solo-maintained SaaS doesn't need yet.

**Alternatives considered**: A dedicated `rate_limits` counter table with a sliding window.
Rejected as unnecessary machinery for the current scale (Principle VI) — the count query above
already answers "how many in the last hour" directly against `grader_results`, which already
carries every row needed.

## R5. RLS and column-grant testing

**Decision**: pgTAP, run via `supabase test db`.

**Rationale**: Constitution Principle III requires, explicitly, that *"every policy MUST have a
test proving both that the owner CAN perform the action and that a different authenticated user
CANNOT... Score columns MUST have a test proving an authenticated user cannot write to them."*
pgTAP is Supabase's own supported tool for exactly this (`supabase test db` wires it up with zero
extra infrastructure), and it runs as SQL, so tests exercise the actual policies and grants — not a
reimplementation of them in application code that could drift from what's deployed.

**Alternatives considered**: Hand-written scripts using `psql` with `set local role authenticated;
set local request.jwt.claims = '...'`. This is what pgTAP does internally, with less assertion
sugar and no test-runner integration; pgTAP is strictly less code for the same coverage.

## R6. Edge Function unit testing

**Decision**: Deno's built-in test runner (`deno test`), applied to pure functions extracted from
the function's request-handling code: the gate checks, feature extraction, band-snapping,
length-penalty, and aggregation math (mirroring `eval/src/pipeline/aggregate.py`'s already-proven
logic, ported to TypeScript). The one external dependency (the OpenRouter call) is exercised via a
fake client in integration-style tests, mirroring `eval/tests/fakes/fake_llm_client.py`'s role in
the Python test suite.

**Rationale**: No test framework needs installing — `deno test` ships with the Deno runtime Edge
Functions already run on. Extracting the arithmetic into pure functions (rather than testing only
through the full HTTP handler) is what makes AD-1 ("the model never counts and never calculates")
and FR-007's determinism directly testable, per Principle III.

## R7. Porting the scoreability gate

**Decision**: Port `eval/src/pipeline/preprocess.py`'s heuristics directly — the `ABSOLUTE_MIN_WORDS
= 20` floor and the Latin-script-ratio check for "not predominantly English" — to a small TypeScript
module with the same thresholds.

**Rationale**: These are simple regex-based heuristics with no ML dependency; porting is
mechanical, and reusing the exact thresholds means the golden-set assumptions behind them (already
validated against the ten existing samples) carry over rather than being re-derived from scratch.

## R8. Retry-on-invalid-output

**Decision**: One retry with a repair instruction appended to the conversation, mirroring
`eval/src/llm/openrouter_client.py`'s existing `REPAIR_TEMPLATE` pattern — implemented directly in
the Edge Function rather than as a shared library.

**Rationale**: The pattern is proven (it's the same retry-repair loop the inherited pipeline already
uses) and small enough (a few lines) that porting beats depending on a cross-runtime package.
FR-018/§11 require exactly one retry before treating a submission as failed — this is what
implements that requirement.

## Summary of what Phase 1 builds on

- One new Postgres migration: `grader_results`, `llm_calls`, RLS policies, column-revokes, the
  partial unique index (R4), and the completeness/band-grid check constraints already specified in
  spec.md §13.
- One new Edge Function, `grade-task`, structured as small testable modules (R6) rather than one
  monolithic handler.
- One new eval pipeline version, `v2`, plus the harness change needed to benchmark it (R2) — the
  before/after comparison against `v1` is the Principle IV artifact this feature must produce.
- pgTAP tests for the database layer, Deno tests for the function layer (R5, R6).
