# Implementation Plan: IELTS Grading Pipeline — Single-Call (pipeline-v2.0)

**Branch**: `00-grading-feature` (not yet created) | **Date**: 2026-08-23 | **Spec**: [spec.md](./spec.md)

**Status update (2026-08-23)**: both phases are done, and Phase A's benchmark changed
what Phase B was built on.

*Phase A* built `pipeline-v2.0` and measured it against `pipeline-v1.0` on the same ten
golden essays. Two of this plan's assumptions turned out to be wrong (SC-004's cost
saving, SC-001's latency budget), and the single-call design was **dropped** on that
evidence — [phase-a-findings.md](./phase-a-findings.md) has the numbers. This is the
"benchmark before adopting" gate (Constitution IV) doing exactly its job: it cost one
Phase A rather than an Edge Function built around a wrong assumption.

*Phase B* was therefore built on `pipeline-v3.0` — v1's four concurrent calls with the
bilingual fields added — rather than on v2. The file layout below is what was built,
with two additions the plan did not anticipate: the prompts, rubrics, lexicon and JSON
schema are **generated** from `eval/` by `eval/scripts/export_edge_assets.py` (a
hand-copied rubric would drift from the benchmarked one silently), and the Edge Function
validates Vietnamese output server-side, because Phase A measured the model leaking
Chinese and Thai into `vi` fields and a prompt rule alone did not stop it.

Also fixed while getting this to run: `service_role` had no SELECT/UPDATE grant on
`writing_attempts` at all. `auto_expose_new_tables` is off for this project and
migrations `0004`/`0005` granted only `authenticated`, so the very first thing to run as
service_role failed with "permission denied". RLS was never what stood in the way —
service_role bypasses RLS but is still subject to table privileges.

**Input**: Feature specification from `specs/00-grading-feature/spec.md`, grounded in
`CLARIFICATION.md` Task 2 (data model) and Task 3 (system architecture), which are already
implemented (`supabase/migrations/2026082300000{4,5}_*.sql`) and already documented as
"designed, not built" for the grading path (`docs/system-architecture.md` §4, `TODO.md` lines
101–103).

## Summary

Reduce the grading pipeline from 4 model calls per essay (`eval/`'s current `pipeline-v1.0`, one
call per criterion, `asyncio.gather`) to **1 call per essay** requesting all 4 criteria — with
bilingual comments and evidence — in a single response, using a consolidated prompt that inlines
all 4 rubrics plus one few-shot worked example. Everything numeric — overall band, length penalty,
band snapping, criterion ordering — stays deterministic code around the model, never inside it;
this is unchanged from `v1` and is the property that makes the result reproducible and auditable.

Per Constitution Principle IV, this ships as a **new versioned methodology**, `pipeline-v2.0`,
built and benchmarked in `eval/` against the golden set **first**. Only once that benchmark clears
the acceptance bar (spec.md SC-002) does the validated prompt get copied into a new Supabase Edge
Function, `grade-attempt`, wired to the dispatch mechanism `CLARIFICATION.md` already decided
(`AFTER INSERT` trigger + `pg_net.http_post`, cron sweeper for stuck `queued` rows) — which does
not exist yet in any of the 9 current migrations and is therefore also built here.

This plan has **two phases with a hard gate between them**, not one undifferentiated task list:

```
Phase A (eval/, Python)              Phase B (Supabase, TypeScript)
────────────────────────             ──────────────────────────────
prompts/v2/ + pipelines/v2.yaml  →   ██ GATE: SC-002 must pass ██  →  functions/grade-attempt/
single-call orchestration mode                                       dispatch migration
benchmark vs v1 on golden set                                        pgTAP + deno test
```

Phase B is not started until Phase A's benchmark artifact exists and clears the bar. This is the
one thing in this plan that is not negotiable by convenience — it is Constitution IV applied
literally, not a process nicety.

## Technical Context

**Language/Version**: Python 3 (existing `eval/` toolchain, unchanged) for Phase A. TypeScript on
Deno (Supabase Edge Functions runtime) for Phase B's `grade-attempt`; SQL for the dispatch
migration.

**Primary Dependencies**: Phase A — none new; reuses `eval/src/llm/openrouter_client.py`,
`eval/src/schemas/assessment.py` (gains one new Pydantic model, §Project Structure), the existing
harness. Phase B — `supabase-js` is already the frontend's dependency (unchanged, not touched by
this feature); the Edge Function itself has no new runtime dependency, same as old spec 001's R1 —
the OpenRouter call is a plain `fetch`.

**Storage**: No new tables. `public.writing_attempts` and `public.llm_calls`
(`supabase/migrations/20260823000004_writing_attempts.sql`, `...000005_llm_calls.sql`) are already
exactly the right shape for a one-jsonb-write-per-attempt pipeline — they were designed that way
from the start (CLARIFICATION D-3), not adapted from a 4-row design. One new migration for the
dispatch trigger + cron sweeper only.

**Testing**: `pytest` (existing `eval/tests/`, extended with a `v2` single-call orchestration test
and a benchmark run) for Phase A. `deno test` for `grade-attempt`'s pure logic (gate, extract,
reorder, snap, length-penalty, aggregate — mirroring `eval/src/pipeline/`'s already-proven logic,
ported) plus a fake-LLM-client integration path, for Phase B. `supabase test db` (pgTAP) for the
new migration's trigger/cron behaviour and a regression check that `writing_attempts`'s existing
RLS/column-grants (already tested once, per `CLARIFICATION.md` §2.6 checklist) still hold —
Constitution Principle III requires this regardless of whether this feature touches those policies.

**Target Platform**: Supabase Edge Functions (Deno, Tier 1) + Supabase Postgres. `eval/` continues
to run as a local/CI Python workbench, not production traffic (Constitution: "[Tier 2] serves no
user traffic" — `eval/` was never Tier 2 to begin with; it is the benchmark harness Principle IV
requires to exist).

**Project Type**: Backend-as-a-Service extension, same classification as old spec 001 — one Edge
Function, one migration, one new `eval/` pipeline version. No `backend/` directory. No frontend
change (spec.md §2, out of scope).

**Performance Goals**: spec.md SC-001 (95% scored/failed within 60s) — easier to hit than `v1`
would have been in production, since 1 call has less tail-latency variance than waiting on the
slowest of 4 concurrent calls.

**Constraints**: Exactly one LLM call per graded row (FR-001). Bilingual output generated in that
same call, not a separate translation step (your explicit choice this session). The model never
counts or calculates (unchanged, AD-1). The Edge Function must reorder criteria by code before
persistence — never trust the model's own ordering (FR-005, new relative to `v1`, which never had
an ordering problem because each call only ever produced one criterion).

**Scale/Scope**: Same solo-maintained-SaaS scale as the rest of the project. Cost-bounded by the
existing 20/hour/learner rate limit (CLARIFICATION S-6, already decided, not re-litigated here).

## Constitution Check

*GATE: must pass before Phase A work begins. Re-checked after Phase A's benchmark, before Phase B
begins.*

| Principle | Gate | Status |
|---|---|---|
| I. Rubric-Grounded, Explainable Scoring | Every band ships with a descriptor-grounded, bilingual comment | **PASS** — unchanged from what `v1`'s design already provides per-criterion; this feature changes call count, not what is explained |
| II. Teach-to-Improve Guidance | N/A — this feature is scoring, not the guidance feature | **N/A** |
| III. Test-First Development | pgTAP for the new dispatch migration; `deno test` for reorder/snap/penalty/aggregate before the handler is built around them; `pytest` for the `v2` orchestration mode before it's benchmarked | **PASS**, planned — not yet written (this is a plan, not code) |
| IV. Evaluation-Driven Methodology Changes | `pipeline-v2.0` is versioned config (`pipelines/v2.yaml`), benchmarked against `v1` on the golden set before adoption (spec.md US5, SC-002); every row records `pipeline_version`/`model_id` | **PASS, with a caveat worth stating plainly**: the constitution's own text for this principle says *"a dataset small enough to overfit against is not a sufficient basis for a methodology change"* and names 10 samples as exactly that size. The golden set has not grown since — there is no production traffic yet to grow it from (`pipeline-v1.0` has never run in production; only in `eval/` benchmarks). SC-002's comparison is therefore the best evidence available pre-launch, not a fully compliant "grown from production data" evaluation. Recorded here rather than glossed over; the golden set is expected to grow from real submissions once `grade-attempt` is live, per the constitution's own instruction, as a follow-up — not blocking this feature, but not silently satisfied either. |
| V. Cost-Conscious LLM Usage | Model/params from versioned config; 1 call is itself the cost reduction (FR-001); existing 20/hour rate limit applies unchanged; every call recorded in `llm_calls` (FR-007) | **PASS** |
| VI. Simplicity & Reusable Design | No new compute tier (stays Tier 1); no cross-runtime shared prompt package (manual copy step, same reasoning as old spec 001 R3 — 50-ish lines of prompt text does not justify build tooling) | **PASS** |
| VII. Observability, Error Handling & Security by Default | RLS/column-grants already enforce that only `service_role` writes score columns (unchanged, re-verified not re-built); `llm_calls` records pipeline/prompt/model/status/latency/tokens/cost/retry per call (already the right shape); `raw_response` on `llm_calls` is where `justification`/`descriptor_reference`/`confidence` land — internal-only, per spec.md §11 | **PASS** |
| VIII. Database-Mediated Compute | Frontend still never learns `grade-attempt` or OpenRouter exist; row-write-and-watch is unchanged; going from 4 calls to 1 is entirely inside the Edge Function, invisible past arrow 3 of spec.md §5.1's diagram | **PASS** |

**No unjustified violations. Complexity Tracking is empty** — the one caveat above (Principle IV's
golden-set-size language) is a stated evidence limitation, not a deviation this plan is choosing to
take; nothing here required trading away a principle for convenience.

## Project Structure

### Documentation (this feature)

```text
specs/00-grading-feature/
├── spec.md                        # feature spec — what and why
├── plan.md                        # this file — how, and in what order
```

No `research.md`/`data-model.md`/`contracts/`/`quickstart.md` in this pass — the research
questions old spec 001 needed to answer (runtime choice, versioning strategy, rate-limit
mechanism, RLS test tooling) are already answered and are either already implemented (schema,
RLS) or already decided in `CLARIFICATION.md` (S-1..S-7) and reproduced by reference in spec.md
rather than re-derived. Add `research.md` later only if Phase B surfaces a genuinely new unknown
that isn't already covered by `CLARIFICATION.md` or the inherited old-spec rationale.

### Source code — Phase A (`eval/`)

```text
eval/
├── prompts/
│   └── v2/                              # NEW
│       ├── system.txt                   # generalised from v1/criterion_system.txt —
│       │                                #   "assess all four criteria together"
│       ├── user.txt                     # NEW structure: all 4 rubrics inlined, few-shot
│       │                                #   example, then the real essay (spec.md §10)
│       ├── few_shot_example.txt         # one worked example, drawn from an existing
│       │                                #   eval/data/golden/ essay — picked and reviewed
│       │                                #   by a human before use, not generated
│       └── rubrics/  →  reuse v1/rubrics/*.txt unchanged (symlink or direct copy, TBD
│                        during implementation — no rubric text changes)
├── pipelines/
│   └── v2.yaml                          # NEW — same model/temperature/seed/length-penalty
│                                         #   as v1.yaml; only prompts.version and the
│                                         #   orchestration mode differ
├── src/
│   ├── schemas/
│   │   └── assessment.py                # MODIFIED — new CombinedEvaluation model:
│   │                                     #   list[CriterionEvaluation] in one response,
│   │                                     #   each item gaining bilingual comment/improvement
│   └── pipeline/
│       └── pipeline.py                  # MODIFIED — gains a single-call orchestration
│                                         #   path (`run_assessment_v2` or a mode flag),
│                                         #   reusing aggregate.py/verify.py unchanged
└── tests/
    └── unit/test_combined_evaluation.py # NEW — parses/validates the v2 response shape
```

**Benchmark step** (the Phase A/B gate): `python -m src.evaluation.harness --pipeline-config
pipelines/v2.yaml` against `eval/data/golden/{task_1,task_2}/`, compare `metrics.json` against the
existing `v1` run. Only a pass against spec.md SC-002/SC-003 opens Phase B.

### Source code — Phase B (Supabase), started only after the gate above

```text
supabase/
├── functions/
│   └── grade-attempt/                   # NEW — name matches docs/system-architecture.md
│       │                                #   (not old spec 001's "grade-task" — that name
│       │                                #   is superseded, noted so nobody resurrects it)
│       ├── index.ts                     # handler — orchestrates spec.md §6's 9 steps
│       ├── gate.ts                      # ported from eval/src/pipeline/preprocess.py
│       ├── extract.ts                   # ported from eval/src/pipeline/preprocess.py
│       ├── reorder.ts                   # NEW — sorts model's criteria into fixed code
│       │                                #   order; does not exist in v1 (spec.md §11)
│       ├── aggregate.ts                 # ported from eval/src/pipeline/aggregate.py
│       ├── verify.ts                    # ported from eval/src/pipeline/verify.py
│       ├── prompt.ts                    # builds the request from the copied prompts/
│       ├── openrouter.ts                # one call + one retry (ported pattern, R8)
│       ├── prompts/                     # MANUAL COPY of eval/prompts/v2/ once it has
│       │                                #   cleared the benchmark gate — not a build step
│       │                                #   (old spec 001 R3's reasoning, reused as-is)
│       └── grade-attempt.test.ts        # deno test — gate/extract/reorder/aggregate/verify
│
├── migrations/
│   └── <timestamp>_grade_attempt_dispatch.sql   # NEW — the one piece of infra this
│       │                                          feature must build (spec.md §13):
│       │  - trigger AFTER INSERT on writing_attempts (status='queued') → pg_net.http_post
│       │  - cron job (pg_cron) sweeping writing_attempts_pending_idx: rows in
│       │    ('queued','scoring') older than 5 minutes → status='failed',
│       │    error_code='DISPATCH_TIMEOUT'
│       │  - supabase secrets set OPENROUTER_API_KEY=…, plus the function's own
│       │    service_role access (Edge Functions get this by default; no new grant)
│
└── tests/
    └── grade_attempt_dispatch.sql       # pgTAP — trigger fires on insert; sweeper claims
                                          #   an artificially-aged queued row; a second
                                          #   in-flight row for the same user is unaffected
```

**Structure Decision**: Same as old spec 001 — no `backend/` directory, Tier 1 only. The one
naming correction relative to that old plan: the function is `grade-attempt` (matching
`docs/system-architecture.md`, `CLARIFICATION.md`, and `TODO.md` line 101 — all three already use
this name), not `grade-task`. Old spec 001 predates that naming; this plan uses the name already
in use everywhere else in the repo so nothing has to be renamed later.

## What this plan deliberately does not re-decide

Everything CLARIFICATION.md already marked ✅ stays as decided — this plan does not reopen any of
these, and implementation should treat them as settled:

- **S-1** dispatch mechanism (trigger + `pg_net`, cron sweeper) — detailed above, not re-argued.
- **S-3** model (`nvidia/nemotron-3-super-120b-a12b:free`) — same model for `v2` as `v1`, only the
  call count changes; changing the model at the same time as the call count would make SC-002's
  comparison measure two variables at once.
- **S-5** timeout (60s) and retry count (exactly 1) — unchanged.
- **S-6** rate limit (20/hour/learner) — unchanged, enforced in the gate step.
- **D-4** chart images are not sent to a vision model — unchanged; scoring reads
  `chart_description` only.
- **Reasoning must stay off** (`reasoning: { enabled: false }` in the model config) — this is not
  a `v2`-specific choice, it is the already-measured fix for the failure mode recorded in
  `docs/live-model-validation.md` (reasoning tokens consumed the entire budget and left no room
  for the JSON). `pipelines/v2.yaml` inherits this setting from `v1.yaml` unchanged; **re-disabling
  it "to see if quality improves" is not in scope for this feature** and would need its own
  benchmark run to justify, per Principle IV.

## Complexity Tracking

*No entries.* The one caveat this plan surfaces (Principle IV's golden-set-size language, above)
is disclosed, not traded away — nothing here required weakening a principle to make progress.

## Next step, if you approve this plan

Phase A first: `eval/prompts/v2/` + `eval/pipelines/v2.yaml` + the single-call orchestration path
in `pipeline.py`, then the golden-set benchmark run. That benchmark's result is what determines
whether Phase B (the actual `grade-attempt` Edge Function) starts at all — not a formality, the
literal gate. Say the word and I'll start there; I have not written any implementation code yet.
