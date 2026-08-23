# What was built vs. what was specified

**Date**: 2026-08-23 · Companion to [spec.md](./spec.md), [plan.md](./plan.md),
[phase-a-findings.md](./phase-a-findings.md)

This records every place the delivered system differs from the specification, and what
is still blocked. It exists because the central decision of the spec — one LLM call per
essay — was reversed by its own benchmark, and a spec whose headline requirement no
longer holds is misleading unless the divergence is written down explicitly.

Nothing here was changed quietly. Each entry says what the spec asked for, what shipped,
and why.

---

## 1. The one change everything else follows from

| | Specified | Shipped |
|---|---|---|
| Calls per essay | **1** (`pipeline-v2.0`) | **4, concurrent** (`pipeline-v3.0`) |

`pipeline-v2.0` was built exactly as specified, benchmarked against `pipeline-v1.0` on
the same ten golden essays, and **not adopted**. It graded slightly better (MAE 0.45 vs
0.5; within-0.5 90% vs 70%) but cost ~40% more tokens and ran roughly twice as slow —
p95 72.5s against **the spec's own 60s target in SC-001**.

The latency is structural, not a tuning problem: v1's four calls run concurrently, so
each one's latency hides behind the slowest of the four. One consolidated call has
nothing left to run in parallel, so the entire generation is the critical path.

You chose to drop v2 and return to v1's architecture. `pipeline-v3.0` is that: v1's four
concurrent calls, plus the bilingual `comment`/`improvement` fields — which the spec was
right to require, because `criteria_match_task()` rejects a row without them.

**This is the Constitution IV gate working as intended.** It cost one Phase A instead of
an Edge Function built around an assumption that turned out to be false.

---

## 2. Functional requirements, one by one

| ID | Specified | Shipped | Status |
|---|---|---|---|
| FR-001 | Exactly one LLM call per row | Four, dispatched together via `Promise.all` | ❌ **Reversed** — see §1 |
| FR-002 | Bands + bilingual comments + bilingual improvement + evidence for all 4 criteria | Same, but one criterion per call | ✅ Met, different shape |
| FR-003 | Prompt MUST include a few-shot worked example | **No few-shot example.** `prompts/v3/` is v1's per-criterion prompt | ❌ **Dropped** — see §3.1 |
| FR-004 | Model never computes overall band, snaps bands, or applies length penalty | Unchanged; all three are code (`aggregate.ts`) | ✅ Met |
| FR-005 | Edge Function MUST reorder returned criteria into fixed `code` order | No reordering exists, because none is possible | ✅ Met more strongly — see §3.2 |
| FR-006 | Missing criterion / missing language / parse failure → **exactly one** retry, then `failed` | Up to **two** retries (3 attempts), then `failed` | ⚠️ **Differs** — see §3.3 |
| FR-007 | **Exactly one** `llm_calls` row per graded attempt | **Four** — one per call | ⚠️ **Differs by necessity** — see §3.4 |
| FR-008 | Record `pipeline_version = 'pipeline-v2.0'` | Records `'pipeline-v3.0'` | ✅ Met, different value |
| FR-009 | Rows stuck in `queued` > 5 min → cron sweeper marks them `failed` | Sweeper **re-dispatches** first, fails after 3 attempts | ⚠️ **Differs** — see §3.5 |
| FR-010 | Benchmark v2 against v1 before wiring the Edge Function | Done for v2. **Not done for v3** | 🚧 **Blocked** — see §6.1 |

## 3. Why each difference

### 3.1 No few-shot example (FR-003)

The few-shot example existed to teach the model a shape it had never produced: all four
criteria, both languages, in one object. A per-criterion call does not have that problem
— it returns one criterion, which is the shape v1 already got right without any example.

Adding one anyway would inflate every one of the four prompts with a worked example of a
shape the model is not being asked to produce. The prompt-level cost is real and the
benefit is speculative.

### 3.2 Nothing to reorder (FR-005)

FR-005 exists because a single call returns four criteria and the model may order them
however it likes. Two things made it moot:

- In v2, the response schema used **named fields** (`task_achievement`,
  `coherence_cohesion`, …) rather than an array plus a `code` field. With
  `strict: true`, order stops being expressible, let alone wrong. *(This was already a
  disclosed deviation from spec §11 during Phase A.)*
- In v3, each call returns exactly one criterion, and the persisted array is built by
  iterating `CRITERIA_BY_TASK[task_type]` — the fixed order is the loop, not a sort.

The requirement's intent (a stored `criteria` array always in the constraint's fixed
order) holds. The mechanism it prescribed is not present because it cannot fail.

### 3.3 Two retries, not one (FR-006)

`openrouter.ts` inherits the Python client's retry-repair loop verbatim, including its
`max_retries: 2` from `pipelines/v3.yaml`. Reducing it to one purely to match the spec's
number would have meant either diverging from the benchmarked Python configuration or
editing that configuration — and the retry count is a **config value**, not code
(Constitution IV), so it can be changed in `v3.yaml` without touching either
implementation if you want the stricter behaviour.

The important half of FR-006 is met exactly: no partial result is ever persisted.

### 3.4 Four ledger rows, not one (FR-007)

FR-007 said one row because v2 made one call. The underlying policy from
`CLARIFICATION.md` §3.2 is **one `llm_calls` row per model call** — that is what makes
the table a cost ledger. With four calls, one row would hide three-quarters of the
spend, which is the exact failure FR-007 was written to prevent.

Four rows per attempt is the spec's intent, not a departure from it.

### 3.5 The sweeper retries before it gives up (FR-009, SC-006)

FR-009 said "stuck > 5 minutes → `failed`". What shipped re-dispatches instead, and only
fails after three dispatch attempts, because the most common cause of a stuck row is a
dropped `pg_net` request — which a retry fixes, while failing immediately throws away a
perfectly gradeable essay and the learner's wait.

**Honest consequence:** worst case, a row whose dispatch fails every time reaches
`failed` at roughly **15 minutes** (dispatch at 0, retries at 5 and 10, given up at 15),
not the 10 minutes **SC-006** specifies. Tightening `grading_dispatch_grace()` to 3
minutes brings the worst case to 9 and satisfies SC-006 exactly; it is one line in
migration `0010`, deliberately left at 5 because a slow-but-succeeding assessment is
worth more than hitting the number.

---

## 4. Success criteria

| ID | Target | Status |
|---|---|---|
| SC-001 | 95% reach `scored`/`failed` within 60s | ⏸ **Unmeasured for v3.** Measured for v1 (p95 23.9s) and v2 (p95 72.5s). v3 shares v1's architecture, so v1's number is the best available estimate — but it is an estimate |
| SC-002 | v2's MAE within 0.5 bands of v1's | ✅ Met by v2 (0.45 vs 0.5). ❌ **Never measured for v3**, which is what actually ships — see §6.1 |
| SC-003 | Quote fidelity within 5pp of v1's | ⏸ Unmeasured for v3. v1 0.986, v2 0.988 |
| SC-004 | Cost drops to ~25% of v1's | ❌ **Invalidated.** Cost tracks tokens, not calls. v3 costs the same as v1 — no saving was achieved, and none is claimed |
| SC-005 | `grep -r "functions/v1\|openrouter" frontend/src` returns nothing | ✅ **Verified, returns nothing.** The client-compute boundary holds |
| SC-006 | A silently-dropped dispatch reaches `failed` within 10 min | ⚠️ Picked up within 5 min, but worst case reaches `failed` at ~15 min — see §3.5 |

---

## 5. Beyond the spec

### 5.1 Scope: the frontend was explicitly out of scope, and changed anyway

spec.md §2 and plan.md both state "No frontend change." You asked mid-session for the
test to run from the frontend rather than only against Supabase, which requires the
frontend to actually call the pipeline. So `frontend/src/lib/api/grading.ts` now wires
`gradeEssay`/`getResult` to the real pipeline.

The client-compute boundary is intact: the client inserts a `queued` row and polls it. It
calls no function endpoint, which is why SC-005 still passes.

**Still mock:** `gradeMockSubmission`. A mock sitting needs both halves marked before it
means anything, and the `mock_test_attempts` bookkeeping around it is a second thing to
get right; doing both in one change would make neither verifiable.

**Polling, not realtime.** The table is in the realtime publication and the migration's
own comments describe realtime as how the client learns marking finished. Polling every
2s shipped instead: realtime saves a second or two of a 15–30s wait but adds a socket
whose every failure mode falls back to polling anyway. Worth revisiting if marking ever
gets fast enough for 2s to matter.

### 5.2 Generated assets — nobody asked for this

The plan said to copy the validated prompt into the Edge Function. Copies drift: edit a
rubric in `eval/` and forget the Edge Function, and the committed benchmark silently
describes a pipeline nobody is running, with both sides still working perfectly on their
own.

So prompts, rubrics, the lexicon, the criterion tables and the JSON response schema are
**generated** from `eval/` by `eval/scripts/export_edge_assets.py`, and
`eval/tests/unit/test_edge_assets_export.py` fails if the two ever diverge.

### 5.3 Server-side Vietnamese validation

Phase A measured the model substituting Chinese (`冠词` for "article"), Thai and Arabic
into `vi` fields — 6 of 80 fields, and tightening the prompt reduced but did not
eliminate it. `openrouter.ts` now rejects a response containing non-Vietnamese script in
a `vi` field and asks for a repair.

Same three-layer pattern already used for quotes: the prompt asks, the schema
constrains, **code enforces**. Only the third layer is load-bearing.

### 5.4 A real security gap, found and fixed

`service_role` had **no SELECT or UPDATE grant** on `writing_attempts` at all.
`auto_expose_new_tables` is off for this project, and migrations `0004`/`0005` granted
only `authenticated` — so nothing could mark a row. The Edge Function failed with
"permission denied for table writing_attempts" on its very first claim.

RLS was never what stood in the way: `service_role` bypasses RLS but is still subject to
table privileges. Fixed in `0010`, granting only `select, update` on `writing_attempts`
and `select, insert` on `llm_calls` — not `insert` on attempts (the learner creates the
row) and not `delete` (nothing server-side should make an attempt disappear).

This was invisible until something actually ran as `service_role`.

### 5.5 `supabase/tests/api.mjs` raced the live dispatcher

That suite hand-marks its own test row as a stand-in for the pipeline. Since `0010`, the
real pipeline reacts to the same insert — two writers on one row, and the stand-in's
`status='scoring'` landed on a row the Edge Function had already marked `rejected` with
an `error_code`, which `error_code_only_on_failure` correctly refused.

The suite now disables the dispatch trigger for its duration and re-enables it in
cleanup. **75/75 pass against the local stack.**

Worth knowing: this suite passes on cloud today only because `0010` is not deployed
there. It would have broken on the first deploy.

### 5.6 Smaller deviations

- **`llm_calls.raw_response`**: the spec's Assumptions say `justification`,
  `descriptor_reference` and `confidence` stay internal as an audit trail there. Shipped:
  those three are stored in `writing_attempts.criteria` (readable by the learner through
  RLS), and `raw_response` holds only `{node, error, band}`. Deliberate — `llm_calls`
  already contains learner text via the prompt and is service-role-only, so duplicating
  the full response there adds exposure without adding auditability. **But it does mean a
  learner can read the examiner-facing reasoning if they query the row directly.** Say so
  if that is not what you want; it is one line to move.
- **`word_count` is overwritten** by the Edge Function with its own count. The browser and
  the function tokenise slightly differently, and a result screen showing a different
  number from the one the model was handed undermines the band.
- **`provisional`** is set by the Edge Function when the essay is under the minimum. The
  spec never assigned an owner to this column.
- **pg_net dispatch timeout is 20s**, not the more obvious 5s: a cold Edge Function worker
  measured over 5s to boot, and a 5s timeout aborted delivery before the function had read
  the request — indistinguishable from a network failure.
- **`supabase-js` is imported from `esm.sh`, not `jsr:`** — JSR returns 403 in this
  environment. Harmless, but it is not the import Supabase's own docs show.

---

## 6. Blocked

### 6.1 🚧 No benchmark for the pipeline that actually ships

**This is the most important item on the page.**

plan.md states the gate in absolute terms: *"The Edge Function is never wired to a
pipeline version that hasn't cleared SC-002."* `pipeline-v3.0` has **not** been
benchmarked. The Edge Function runs it.

- **Cause**: the OpenRouter free-tier **daily** quota was exhausted by Phase A's two
  ten-essay benchmark runs earlier the same day. Every subsequent call returns 429.
- **Why it is not nothing**: v3 shares v1's architecture, and v1 *does* have a real
  benchmark (MAE 0.5, within-0.5 70%). But v3's **prompt** differs from v1's — it asks
  for two extra fields per criterion — and prompt changes move bands. Treating v1's
  numbers as v3's is an assumption, not a measurement.
- **Unblock**: `cd eval && python -m src.evaluation.harness --pipeline-config pipelines/v3.yaml`
  Compare `metrics.json` against `eval/data/reports/20260823-175455-518e/` (the real v1 run).
- **Until then**: v3 is unproven for accuracy. Everything mechanical around it is proven.

### 6.2 🚧 No essay has been scored successfully, end to end

Same cause. What **has** been verified on the local stack:

| Path | Result |
|---|---|
| Junk text → gate | `rejected` / `NOT_ENGLISH`, **zero model calls** |
| Real essay → 4 concurrent calls | 4 `llm_calls` rows (`rate_limited`), row → `failed` / `RATE_LIMITED` |
| From the frontend's own data layer | Both paths, via `gradeEssay` — 2/2 integration tests pass |

Every link works. The model is the only thing that has not answered.

**Unblock**: `RUN_LOCAL_SUPABASE=1 npx vitest run tests/integration` in `frontend/`. The
"marks a real essay" test already asserts the full result shape and will exercise it the
moment a call succeeds.

### 6.3 🚧 Not deployed to cloud

Cloud runs migrations `0001`–`0009`. Deploying needs, in order:

1. `supabase db push` (applies `0010`)
2. The three `vault.create_secret` calls documented at the bottom of `0010`
3. `supabase secrets set GRADE_ATTEMPT_SECRET=… OPENROUTER_API_KEY=…`
4. `supabase functions deploy grade-attempt`

Skipping step 2 or 3 does not error loudly — submissions simply stay `queued` while
`dispatch_grading` logs a warning every minute.

Note also §5.5: `api.mjs` on cloud must be re-run **after** the deploy.

### 6.4 📋 Not built, and known to be missing

- **pgTAP tests for `0010`.** plan.md's Testing section asked for `supabase test db`
  covering the trigger and sweeper. What exists instead is live verification on a local
  stack plus the `api.mjs` regression. That is evidence, but it is not a test that runs
  on its own — a Constitution III gap, stated rather than glossed over.
- **Rate limiting** (Constitution V, `CLARIFICATION.md` S-6: 20 gradings/hour/learner).
  Referenced by the plan as an existing constraint; no implementation exists anywhere.
  A learner can currently submit in a loop.
- **`gradeMockSubmission`** — still mock. See §5.1.

### 6.5 ℹ️ Unrelated, pre-existing

`frontend/tests/unit/landing/Hero.test.tsx` — 7 failures. Confirmed present without any
of this work (verified against a stash). The component renders Vietnamese where the test
expects English. Untouched here.
