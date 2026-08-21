# Tasks: WriteWise Grader — Single-Task IELTS Writing Assessment

**Input**: Design documents from `/specs/001-ielts-score-assessment/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/grade-task-openapi.yaml](./contracts/grade-task-openapi.yaml), [quickstart.md](./quickstart.md)

**Tests**: **REQUIRED, not optional.** Constitution Principle III (NON-NEGOTIABLE) mandates
red-green-refactor, and explicitly requires RLS/column-grant tests proving both "owner CAN" and
"a different authenticated user CANNOT" for every policy. `plan.md`'s Constitution Check already
commits to this. Every test task below MUST be completed — and MUST fail — before its paired
implementation task.

**Organization**: Grouped by user story from spec.md (US1–US4), preceded by Setup and Foundational
phases. Story priorities: US1 (P1, MVP), US2 (P1), US3 (P2), US4 (P2).

**Deploying to the real Supabase project (`supabase login`/`link`/`db push`/`functions deploy`/
`secrets set`) is explicitly OUT of this task list's automatic scope.** Per the project's
GitHub-integration setup, pushing schema/function changes to `main` auto-deploys to the live
project — each such push requires the user's explicit go-ahead at that moment, not a blanket
approval here. Tasks below build and verify everything against the **local** Supabase stack
(`supabase start`, Docker) and `deno test`, which touch no live data.

## Path Conventions

Per plan.md's Project Structure — no `backend/`/`frontend/` split for this feature:

- `supabase/functions/grade-task/` — the Edge Function (Deno/TypeScript)
- `supabase/migrations/` — schema
- `supabase/tests/` — pgTAP
- `eval/prompts/v2/`, `eval/pipelines/v2.yaml`, `eval/src/pipeline/pipeline.py` — the new
  benchmarked pipeline version (research.md R2)

---

## Phase 1: Setup

**Purpose**: Scaffolding and the versioned prompt/pipeline content everything else depends on.

- [ ] T001 Create the directory scaffold: `supabase/functions/grade-task/`,
      `supabase/functions/grade-task/prompts/`, `supabase/migrations/`, `supabase/tests/`
- [ ] T002 [P] Initialize `supabase/functions/grade-task/deno.json` (import map, `fmt`/`lint`
      config) so `deno test`/`deno fmt`/`deno lint` run against the function directory
- [ ] T003 [P] Author `eval/prompts/v2/system.txt` and `eval/prompts/v2/user.txt` — one
      consolidated prompt requesting all four criteria and their comments in a single response,
      adapted from `eval/prompts/v1/criterion_system.txt`, `criterion_user.txt`, and
      `rubrics/*.txt` (research.md R2). Must include: the task-type-specific rubric block, the
      instruction NOT to deduct for length (§9's paired instruction), and the bilingual-comment
      requirement (Vietnamese explanation, English IELTS terminology — FR-015, refined further in
      T029)
- [ ] T004 [P] Author `eval/pipelines/v2.yaml` — same `model`/`temperature`/`seed` values as
      `eval/pipelines/v1.yaml`, `prompts.version: v2`, unchanged length-penalty thresholds
      (research.md R2)

**Checkpoint**: Scaffolding exists; the prompt/pipeline content Foundational and Polish phases
depend on is authored.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The database schema and the pure-logic modules every user story's grading flow
depends on. No user story can be implemented until this phase is complete.

**⚠️ CRITICAL**: Nothing in Phase 3 onward can be built until this phase is done.

### Database layer (test-first — Principle III, research.md R5)

- [ ] T005 [P] Write `supabase/tests/grader_results_rls.sql` (pgTAP) asserting, against a schema
      that does not yet exist: an owner can `SELECT`/`INSERT` their own `grader_results` row; a
      *different* authenticated user's `SELECT` of that row returns zero rows; the `authenticated`
      role cannot `UPDATE` `overall_band`, `criteria`, `status`, `error_code`, `length_penalty`,
      `pipeline_version`, `prompt_version`, or `model_id` on a row it owns (data-model.md Access
      control). Run `supabase test db` and confirm it fails (red) — the schema doesn't exist yet.
- [ ] T006 Create `supabase/migrations/<timestamp>_grader_results.sql`: the `grader_results` and
      `llm_calls` tables per data-model.md, including the band-grid check on `overall_band`, the
      `length_penalty IN (0, 0.5, 1.0)` check, and the `scored_rows_are_complete` check constraint
      (AD-8 — an incomplete result must be unstorable, not just discouraged)
- [ ] T007 In the same migration, add: RLS enabled on both tables, the "read own"/"insert own"
      policies scoped to `auth.uid()` on `grader_results`, the column-level `REVOKE UPDATE` on the
      score-bearing columns from `authenticated`, and no policy at all on `llm_calls` (service-role
      only by omission — data-model.md)
- [ ] T008 In the same migration, add the partial unique index
      `one_active_submission_per_user on grader_results (user_id) where status in ('queued',
      'scoring')` (research.md R4, FR-029)
- [ ] T009 Run `supabase start` then `supabase test db` locally and confirm every assertion from
      T005 now passes (green) — depends on T006, T007, T008

### Shared pure-logic modules (test-first per module — research.md R6)

- [ ] T010 [P] Write `supabase/functions/grade-task/gate.test.ts` covering: empty/whitespace-only
      input → `EMPTY_SUBMISSION`; below the 20-word absolute floor → `TOO_SHORT`; non-English
      (Latin-script ratio) input → `NOT_ENGLISH`; over the accepted maximum → `TOO_LONG`; valid
      input → passes. Run `deno test` and confirm it fails (red) — `gate.ts` doesn't exist yet.
- [ ] T011 [P] Implement `supabase/functions/grade-task/gate.ts` — port
      `eval/src/pipeline/preprocess.py`'s scoreability heuristics (`ABSOLUTE_MIN_WORDS = 20`,
      Latin-script ratio check) to TypeScript (research.md R7) — makes T010 pass
- [ ] T012 [P] Write `supabase/functions/grade-task/extract.test.ts` covering word count,
      sentence/paragraph counts, cohesive-device detection, and repeated-content-word detection
      against known text fixtures. Confirm it fails (red).
- [ ] T013 [P] Implement `supabase/functions/grade-task/extract.ts` — port
      `eval/src/pipeline/preprocess.py`'s feature extraction and `eval/src/pipeline/lexicon.py`'s
      word lists to TypeScript — makes T012 pass
- [ ] T014 [P] Write `supabase/functions/grade-task/aggregate.test.ts` covering: `round_to_half`'s
      upward-halfway rule (6.25→6.5, 6.75→7.0 — NOT JavaScript's default rounding); `clamp` to
      `[1,9]`; `snap_band`'s coercion flag when input is off-grid or out of range; `length_penalty`
      at the 15%/40% thresholds (FR-009, FR-010); `aggregate_overall`'s determinism — the same four
      inputs MUST always produce the same output (FR-007, SC-007). Confirm it fails (red).
- [ ] T015 [P] Implement `supabase/functions/grade-task/aggregate.ts` — port
      `eval/src/pipeline/aggregate.py`'s logic verbatim to TypeScript (AD-1: the model never
      calculates; AD-3: deduct then aggregate) — makes T014 pass
- [ ] T016 [P] Write `supabase/functions/grade-task/openrouter.test.ts` using a fake LLM client
      (mirroring `eval/tests/fakes/fake_llm_client.py`'s role) covering: a valid four-criteria
      response parses correctly; a response missing one criterion triggers exactly one repair
      retry; a retry that still fails surfaces as a typed, catchable error (§11, research.md R8).
      Confirm it fails (red).
- [ ] T017 Implement `supabase/functions/grade-task/openrouter.ts` — one model call plus one
      repair-retry on invalid output, mirroring `eval/src/llm/openrouter_client.py`'s
      `REPAIR_TEMPLATE` pattern, reading model/temperature/params from the copied pipeline config
      (research.md R8) — makes T016 pass

### Deploy-time content

- [ ] T018 [P] Copy `eval/prompts/v2/` into `supabase/functions/grade-task/prompts/` (research.md
      R3 — a manual, documented copy, not a build step) — depends on T003

**Checkpoint**: Schema exists and its RLS/grants are proven by pgTAP, not just declared. Every pure
module (gate, extract, aggregate, openrouter) is unit-tested in isolation. User story work can now
begin — it is mostly orchestration and prompt-shaping on top of this foundation.

---

## Phase 3: User Story 1 - Grade one piece of writing (Priority: P1) 🎯 MVP

**Goal**: A signed-in learner submits one task and receives four correctly-labelled criterion
bands and a deterministic overall band.

**Independent Test**: Submit a Task 2 essay of adequate length; verify the response contains four
criteria in the fixed order, an `overall_band` reproducible from them, and that switching to Task 1
relabels position 1 from "Task Response" to "Task Achievement".

### Tests for User Story 1 ⚠️ Write first, confirm they fail

- [ ] T019 [P] [US1] Contract test in `supabase/functions/grade-task/grade-task.test.ts`: POST a
      valid `TASK_2` submission and assert the response matches `GraderResult` in
      contracts/grade-task-openapi.yaml — four `criteria`, an `overall_band`, `provisional: true`
- [ ] T020 [P] [US1] Integration test in `grade-task.test.ts`: submit once with `task_type:
      "TASK_1"` and once with `"TASK_2"`; assert position 1's `code`/`label` is
      `TASK_ACHIEVEMENT`/"Task Achievement" for the former and `TASK_RESPONSE`/"Task Response" for
      the latter (FR-032, quickstart.md US1 scenario 2)
- [ ] T021 [P] [US1] Integration test in `grade-task.test.ts`: assert `overall_band` in the
      response equals `round_half_up(mean(criteria[*].band))` computed independently in the test
      (FR-004, FR-007, quickstart.md US1 "Also check" scenario 4)

### Implementation for User Story 1

- [ ] T022 [US1] Implement `supabase/functions/grade-task/prompt.ts` — builds the single
      consolidated prompt from `prompts/system.txt`/`user.txt` (T018), injecting the
      `task_type`-specific rubric section, T013's extracted features as ground truth, and the
      "do not deduct for length" instruction — depends on T013, T018
- [ ] T023 [US1] Implement `supabase/functions/grade-task/index.ts` — orchestrate spec.md §6's 8
      steps for the success path: gate (T011) → insert row `status='queued'`→`'scoring'` → extract
      (T013) → build prompt (T022) → call model (T017) → snap bands (T015) → apply length penalty
      (T015) → aggregate overall (T015) → update row `status='scored'` → insert the `llm_calls` row
      → return the result — depends on T011, T013, T015, T017, T022, T007
- [ ] T024 [US1] In `index.ts`, wire the fixed code→label mapping table from spec.md §7
      (position 1 depends on `task_type`; positions 2–4 fixed) into the response's `criteria`
      construction (FR-032) — depends on T023
- [ ] T025 [US1] Run `supabase start` + `supabase functions serve grade-task` locally and confirm
      T019–T021 now pass (green) — depends on T024

**Checkpoint**: User Story 1 is fully functional and independently testable — the MVP.

---

## Phase 4: User Story 2 - Understand why the band was given (Priority: P1)

**Goal**: Every criterion band arrives with a bilingual, essay-specific comment; length
deductions are shown explicitly rather than silently folded in.

**Independent Test**: Grade an essay with a deliberate mix of strengths/weaknesses; verify each
comment is non-empty, references that essay's actual content, is in Vietnamese with English IELTS
terminology retained, and that an under-length submission's deduction is visible and correctly
sized.

### Tests for User Story 2 ⚠️ Write first, confirm they fail

- [ ] T026 [P] [US2] Integration test in `grade-task.test.ts`: grade a fixture essay with a known
      weak sentence and a known strong sentence; assert each of the four `comment`s is non-empty
      and references identifiable characteristics of that specific essay rather than generic text
      (FR-013, FR-014)
- [ ] T027 [P] [US2] Integration test in `grade-task.test.ts`: assert every `comment` contains
      Vietnamese-script characters while `label` values and any quoted descriptor language remain
      in English (FR-015)
- [ ] T028 [P] [US2] Integration test in `grade-task.test.ts`: submit an essay more than 40% under
      the task minimum; assert `length_penalty === 1.0` and that the first criterion's `band` is
      exactly 1.0 lower than the corresponding `llm_calls.raw_response` band before the deduction
      (FR-009, FR-012, SC-014)

### Implementation for User Story 2

- [ ] T029 [US2] Refine `eval/prompts/v2/user.txt` (and `supabase/functions/grade-task/prompts/`
      via T018's copy step) with explicit bilingual-comment instructions — Vietnamese explanation,
      English IELTS terminology retained (FR-015) — depends on T003; re-run T018's copy after
      editing
- [ ] T030 [US2] Add comment-non-empty validation to `openrouter.ts`'s response parser — a parsed
      response with any empty `comment` is treated the same as a missing criterion and triggers
      the retry path (FR-013, FR-016) — depends on T017
- [ ] T031 [US2] Confirm `index.ts`'s response surfaces `length_penalty` explicitly (already
      populated by T015/T023) and that the pre-penalty band remains auditable via the linked
      `llm_calls.raw_response` row (FR-012) — depends on T023
- [ ] T032 [US2] Set `provisional: true` on every `index.ts` response, per constitution TP-1's
      remaining scope (machine-verified evidence anchoring is not yet implemented) — depends on
      T023

**Checkpoint**: US1 + US2 together deliver the full "graded and explained" experience.

---

## Phase 5: User Story 3 - Revisit past submissions (Priority: P2)

**Goal**: A learner's past submissions are stable and readable only by them.

**Independent Test**: Grade two submissions; read both back via `supabase-js` directly (no
Edge Function involved, per contracts/grade-task-openapi.yaml's GET note) and confirm identical
bands; confirm a different learner cannot read them.

### Tests for User Story 3 ⚠️ Write first, confirm they fail

- [ ] T033 [P] [US3] Extend `supabase/tests/grader_results_rls.sql` with an explicit two-learner
      isolation assertion if not already fully covered by T005: learner B's `SELECT` of a specific
      `grader_result_id` owned by learner A returns zero rows (FR-025, quickstart.md US3
      "Ownership check")

### Implementation / Validation for User Story 3

> No new Edge Function code — this story is delivered by Phase 2's RLS policies. Remaining work
> is validation that those policies actually behave this way end-to-end.

- [ ] T034 [US3] Following quickstart.md's User Story 3 section: as one learner, grade two
      submissions, then query `grader_results` via `supabase-js` ordered by `created_at`; confirm
      both appear with the exact `overall_band`/`criteria` first returned (FR-023) — depends on
      T025 (US1 must be working to produce submissions to read)

**Checkpoint**: History is provably isolated per learner and stable across reads.

---

## Phase 6: User Story 4 - Recover from a failed grading (Priority: P2)

**Goal**: A failed or blocked submission never looks like a low score, never loses the learner's
writing, and can be retried.

**Independent Test**: Force a model failure; verify the writing survives, the failure is
unmistakable, and retrying succeeds. Fire a duplicate request; verify the second is rejected
rather than double-charged.

### Tests for User Story 4 ⚠️ Write first, confirm they fail

- [ ] T035 [P] [US4] Integration test in `grade-task.test.ts`: configure the fake LLM client
      (T016) to always fail; assert the row ends with `status='failed'`, the response matches
      `GraderFailure`, and `essay_text`/`prompt_text` on the row are byte-identical to what was
      submitted (FR-019, FR-020)
- [ ] T036 [P] [US4] Integration test in `grade-task.test.ts`: configure the fake client to return
      only three of four criteria once, then a valid four on the second call; assert exactly one
      retry occurs and the submission ends `scored`. Then configure it to fail both times; assert
      it ends `failed`, never partially scored (FR-018, §11)
- [ ] T037 [P] [US4] Integration test in `grade-task.test.ts`: fire the same submission twice in
      quick succession; assert the second receives `429` with `error_code:
      "SUBMISSION_ALREADY_ACTIVE"` (research.md R4, FR-029)

### Implementation for User Story 4

- [ ] T038 [US4] In `index.ts`, implement the gate-level rate-limit check (count query over the
      last rolling hour, default threshold 20/learner/hour, research.md R4) and handle the
      partial-unique-index insert conflict from T008, returning the correct `429` `error_code` for
      each case (FR-028, FR-029) — depends on T007, T008, T023
- [ ] T039 [US4] In `index.ts`/`openrouter.ts`, implement the failure-path response construction
      (`GraderFailure` shape with `error_code` and `retryable`) and ensure the row transitions to
      `status='failed'` with `error_code` set — never left in `scoring` (FR-020, §12) — depends on
      T017, T023
- [ ] T040 [US4] Confirm every model-call attempt — including a failed retry — is recorded as its
      own `llm_calls` row (FR-027; data-model.md: "a retry produces a SECOND `llm_calls` row, not
      an update to the first") — depends on T017

**Checkpoint**: All four user stories are independently functional and testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: The Principle IV methodology gate, plus a full regression pass.

- [ ] T041 [P] Add a single-call orchestration mode to `eval/src/pipeline/pipeline.py` so the
      golden-set harness can benchmark `pipeline-v2.0` (it currently only runs the four-call `v1`
      orchestration) — research.md R2. This is required for T042, not optional polish.
- [ ] T042 Run the Principle IV hypothesis test: `python -m src.evaluation.harness
      --pipeline-config pipelines/v1.yaml` and `--pipeline-config pipelines/v2.yaml` from `eval/`
      against `eval/data/golden/`; compare the two `metrics.json` artifacts and confirm SC-002
      (≥90% of `v2` overall bands within 0.5 of the human rater's band) holds before treating `v2`
      as production's methodology of record — depends on T003, T004, T041
- [ ] T043 [P] Run `supabase test db` and `deno test` together as a full local regression pass —
      depends on all of Phase 2–6
- [ ] T044 Run quickstart.md end-to-end against the local `supabase start` stack and confirm every
      Acceptance Scenario in spec.md §4 passes — depends on T043

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup (T003/T004 feed T018/T022). **Blocks all user
  stories.**
- **User Stories (Phase 3–6)**: All depend on Foundational completion (T009, T011, T013, T015,
  T017, T018).
  - US1 (Phase 3) has no dependency on US2/US3/US4.
  - US2 (Phase 4) reuses US1's `index.ts`/`prompt.ts` (T022, T023) — build US1 first in practice,
    though US2's own tests (T026–T028) can be written as soon as Foundational is done.
  - US3 (Phase 5) depends only on Foundational's RLS (T007) for its policy assertions; T034's
    validation needs a working submission flow, i.e., US1.
  - US4 (Phase 6) depends on Foundational (T007, T008, T017) and reuses US1's `index.ts` (T023).
- **Polish (Phase 7)**: Depends on all four user stories being complete.

### Within Each Phase

- Tests MUST be written and confirmed failing before their paired implementation task (Principle
  III) — every phase above is ordered that way already.
- Database layer (T005–T009) and the four pure-logic module lanes (T010–T017) have no
  dependencies on each other and can proceed in parallel.
- `index.ts` (T023) is the integration point — it cannot be built until every module it
  orchestrates (T011, T013, T015, T017) exists.

### Parallel Opportunities

- **Setup**: T002, T003, T004 — different files, no dependencies.
- **Foundational**: T005 (pgTAP file) and the four `*.test.ts` files (T010, T012, T014, T016) are
  five independent lanes — all can be written in parallel. Once each lane's test fails as
  expected, that lane's implementation (T006–T008 as one lane, T011, T013, T015, T017) can proceed
  independently of the other lanes. T018 is independent of all of them.
- **US1 tests**: T019, T020, T021 — same file, but independent test cases; write together, run
  together.
- **US2 tests**: T026, T027, T028 — same, independent cases.
- **US4 tests**: T035, T036, T037 — same, independent cases.
- **Polish**: T041 and T043 have no dependency on each other (different concerns: eval harness vs.
  Supabase/Deno regression).

---

## Parallel Example: Foundational Phase

```bash
# Five independent lanes, all startable together once Setup (Phase 1) is done:
Task: "Write supabase/tests/grader_results_rls.sql (pgTAP) — T005"
Task: "Write supabase/functions/grade-task/gate.test.ts — T010"
Task: "Write supabase/functions/grade-task/extract.test.ts — T012"
Task: "Write supabase/functions/grade-task/aggregate.test.ts — T014"
Task: "Write supabase/functions/grade-task/openrouter.test.ts — T016"

# Each lane's implementation follows once its own test fails as expected:
Task: "Implement supabase/functions/grade-task/gate.ts — T011 (after T010 fails)"
Task: "Implement supabase/functions/grade-task/aggregate.ts — T015 (after T014 fails)"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational) — the schema, RLS proof, and every pure
   module are non-negotiable prerequisites regardless of which story ships first.
2. Complete Phase 3 (US1).
3. **STOP and VALIDATE**: run T019–T021 and quickstart.md's User Story 1 section against the
   local `supabase start` stack.
4. This is a demonstrable, gradeable submission flow — the MVP — even before US2's bilingual
   comment refinement or US4's failure-path polish exist.

### Incremental Delivery

1. Setup + Foundational → foundation ready, RLS proven, pure logic proven.
2. US1 → grading works end-to-end → demo-able MVP.
3. US2 → comments are explanatory and bilingual → the "why" half of the product is real.
4. US3 → history is provably safe and stable → validate before trusting it in front of a learner.
5. US4 → failures are safe and duplicates are blocked → validate before exposing this to real
   traffic and real cost.
6. Polish → the Principle IV hypothesis test is the gate before calling `pipeline-v2.0` the
   production methodology of record, not an afterthought.

### What is deliberately NOT in this task list

Deploying any of this to the live Supabase project. Every task above is buildable and testable
against the local `supabase start` Docker stack with `OPENROUTER_API_KEY` set as a local secret for
integration tests that need a real model call (most tests here use the fake client from T016 and
need no real key at all). The actual `supabase login` / `link` / `db push` / `functions deploy` /
`secrets set` sequence against the real project — the one already wired to auto-deploy from
`main` — happens only with the user's explicit go-ahead at that time, per the standing agreement
for this feature.
