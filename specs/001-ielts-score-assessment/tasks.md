---
description: "Task list for feature implementation"
---

# Tasks: IELTS Writing Score Assessment & Explainability

**Input**: Design documents from `/specs/001-ielts-score-assessment/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/assessments-openapi.yaml](./contracts/assessments-openapi.yaml),
[quickstart.md](./quickstart.md)

**Tests**: Included — Constitution Principle III (Test-First Development) is NON-NEGOTIABLE for
this project, so every user story below is test-first.

**Scope note**: This feature is **backend-only** plus a thin frontend API client. It ships zero
UI pages or components — `002-core-app-ux` owns the entire workspace UI that calls this API. This
was corrected by `/speckit-analyze` (finding I1): building a full essay-submission page here would
have been immediately superseded and discarded once `002`'s real design landed, so that UI work is
built exactly once, in `002`. Validate this feature end-to-end via [quickstart.md](./quickstart.md)
(`curl`/API calls), not through a browser.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths are relative to the repository root and match plan.md's Project Structure.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure per plan.md.

- [ ] T001 Create the `backend/` and `frontend/` directory trees exactly as laid out in
      [plan.md](./plan.md) Project Structure (`backend/src/{core,domain,llm/{prompts,rubrics},pipeline,evaluation,infrastructure/database,api}`,
      `backend/{pipelines,data/{golden,reports},tests/{contract,integration,unit}}`,
      `frontend/src/lib`)
- [ ] T002 Initialize the backend Python 3.12 project in `backend/pyproject.toml` /
      `backend/requirements.txt` with FastAPI, SQLAlchemy 2.x, Alembic, `psycopg[binary]`,
      pydantic v2 + pydantic-settings, httpx, PyYAML, pytest (research.md decision 1)
- [ ] T003 [P] Initialize the frontend in `frontend/` with Next.js (App Router), TypeScript, and
      Tailwind CSS — scaffold only, no pages or components. Design tokens are **not** ported here;
      `002-core-app-ux`'s Foundational phase (its T004) applies the real `academic_editorial`
      tokens once that design exists (research.md decision 8)
- [ ] T004 [P] Configure backend linting/formatting (ruff + black) in `backend/pyproject.toml`
- [ ] T005 [P] Configure frontend linting/formatting (ESLint + Prettier) in `frontend/.eslintrc.json`
      and `frontend/.prettierrc`
- [ ] T006 [P] Write `backend/Dockerfile` and `backend/docker-compose.yml` (postgres + backend
      services) per plan.md Constraints (dockerized services)
- [ ] T007 [P] Write `frontend/Dockerfile` for the Next.js production build
- [ ] T008 [P] Configure environment management: `backend/src/core/config.py`
      (pydantic-settings reading `OPENROUTER_API_KEY`, `DATABASE_URL`, etc.),
      `backend/.env.example`, `frontend/.env.example`

**Checkpoint**: Repository structure, tooling, and containers are in place.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before any user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T009 Set up the Alembic migrations framework in `backend/alembic.ini` and
      `backend/src/infrastructure/database/migrations/`, pointed at PostgreSQL
- [ ] T010 [P] Create the `Account` (users) SQLAlchemy model in
      `backend/src/infrastructure/database/models.py` per [data-model.md](./data-model.md)
      (id, email, created_at) with its migration — named `Account`, not `Learner`, to match the
      canonical name `003-account-authentication` and `002-core-app-ux` both use
      (`/speckit-analyze` finding I2)
- [ ] T011 [P] Implement the `LLMClient` Protocol and `LLMResponse` in `backend/src/llm/base.py`
      (research.md decision 2)
- [ ] T012 [P] Implement the OpenRouter adapter (async httpx, OpenAI-compatible) in
      `backend/src/llm/openrouter_client.py` (research.md decision 2)
- [ ] T013 [P] Implement a `FakeClient` test double implementing `LLMClient` in
      `backend/tests/fakes/fake_llm_client.py` for offline, deterministic tests
- [ ] T014 Implement the pipeline YAML config loader and schema (prompt id/version, model,
      params) in `backend/src/pipeline/config.py`, reading `backend/pipelines/*.yaml`
      (research.md decision 5, Constitution Principle IV)
- [ ] T015 [P] Author versioned IELTS band-descriptor reference text for both tasks and all four
      criteria in `backend/src/llm/rubrics/` (Constitution Principle I)
- [ ] T016 Implement the bearer-token → learner auth dependency in `backend/src/api/deps.py`
      (FR-008, plan.md "auth dependency" note — assumes tokens are issued by the external auth
      prerequisite; validates and resolves them here)
- [ ] T017 Configure structured logging and a shared error-handling exception mapper in
      `backend/src/api/` (Constitution Principle VII)
- [ ] T018 Migrate the golden dataset essays (`data/exams/task1/*.json`, `data/exams/task2/*.json`)
      from the IE AI Evaluator project into `backend/data/golden/` (research.md decision 6)
- [ ] T019 [P] Set up the frontend API client scaffold (bearer token header, base URL) in
      `frontend/src/lib/apiClient.ts` — this is the only frontend artifact this feature produces;
      `002-core-app-ux` imports it, no page consumes it here

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Get an explained band score for an essay (Priority: P1) 🎯 MVP

**Goal**: A learner submits an essay and receives an overall band plus four criterion bands,
each with a rubric-grounded explanation, within 60 seconds.

**Independent Test**: Submit a sample essay via `POST /api/v1/assessments` and verify the
response contains an overall band, four criterion-level bands, and a non-empty explanation for
each (quickstart.md Scenario 1) — validated directly against the API, no UI involved.

### Tests for User Story 1 ⚠️

> Write these tests FIRST; confirm they FAIL before implementation (Constitution Principle III).

- [ ] T020 [P] [US1] Contract test for `POST /api/v1/assessments` success path (201) in
      `backend/tests/contract/test_assessments_post.py`, per
      [contracts/assessments-openapi.yaml](./contracts/assessments-openapi.yaml)
- [ ] T021 [P] [US1] Contract test for `GET /api/v1/assessments/{submissionId}` in
      `backend/tests/contract/test_assessments_get.py`
- [ ] T022 [P] [US1] Integration test: submit a valid Task 2 essay through the full pipeline
      (using `FakeClient`) and assert a complete result (overall + 4 criteria + explanations) in
      `backend/tests/integration/test_score_assessment_flow.py`
- [ ] T023 [P] [US1] Unit tests for deterministic aggregation (band rounding, length penalty) in
      `backend/tests/unit/test_aggregate.py`

### Implementation for User Story 1

- [ ] T024 [P] [US1] Create the `EssaySubmission` SQLAlchemy model + migration in
      `backend/src/infrastructure/database/models.py` per data-model.md
- [ ] T025 [P] [US1] Create the `AssessmentResult` SQLAlchemy model (JSONB `criteria` column) +
      migration in `backend/src/infrastructure/database/models.py` per data-model.md decision 4
- [ ] T026 [P] [US1] Define Pydantic schemas `AssessmentRequest`, `AssessmentResult`,
      `CriterionScore` in `backend/src/core/schemas.py` matching
      contracts/assessments-openapi.yaml
- [ ] T027 [US1] Implement the preprocess step (word count, basic English/essay-shape check) in
      `backend/src/pipeline/preprocess.py` (depends on: T024)
- [ ] T028 [US1] Implement the 4 concurrent criterion-evaluator prompts and calls
      (`asyncio.gather`) in `backend/src/pipeline/pipeline.py` (research.md decisions 3, 9;
      depends on: T011, T012, T015)
- [ ] T029 [US1] Implement deterministic overall-band aggregation from the 4 criterion bands in
      `backend/src/pipeline/aggregate.py` (depends on: T028)
- [ ] T030 [US1] Implement quote-fidelity verification (each `evidence_quotes` entry must appear
      verbatim in `essay_text`) in `backend/src/pipeline/verify.py` (depends on: T028)
- [ ] T031 [US1] Implement the repository layer for `EssaySubmission`/`AssessmentResult` in
      `backend/src/infrastructure/database/repository.py` (depends on: T024, T025)
- [ ] T032 [US1] Implement `POST /api/v1/assessments` in `backend/src/api/assessments.py`,
      wiring preprocess → pipeline → aggregate → verify → persist (depends on: T014, T016,
      T027, T029, T030, T031)
- [ ] T033 [US1] Implement `GET /api/v1/assessments/{submissionId}` in
      `backend/src/api/assessments.py` (depends on: T016, T031)
- [ ] T034 [US1] Add error handling mapping pipeline/LLM failures to `503 SCORING_FAILED` in
      `backend/src/api/assessments.py` (depends on: T017, T032)
- [ ] T035 [US1] Add structured logging across the submission/scoring lifecycle in
      `backend/src/pipeline/pipeline.py` and `backend/src/api/assessments.py` (depends on: T017, T032)

**Checkpoint**: User Story 1 is fully functional and independently testable at the API level —
this is the MVP. No frontend page exists yet for it; `002-core-app-ux` builds the workspace UI
that calls this API.

---

## Phase 4: User Story 2 - Understand exactly where points were lost (Priority: P2)

**Goal**: Each criterion's explanation quotes the specific passage(s) in the learner's own essay
that support the score.

**Independent Test**: Submit an essay with a deliberate off-topic paragraph and a grammar error;
verify the relevant criterion explanations quote those specific spans, via the API response
(quickstart.md Scenario 2).

### Tests for User Story 2 ⚠️

- [ ] T036 [P] [US2] Integration test: off-topic paragraph reduces Task Response score with a
      matching quote, and a grammar error is quoted under Grammatical Range & Accuracy, in
      `backend/tests/integration/test_evidence_anchoring.py`

### Implementation for User Story 2

- [ ] T037 [US2] Extend criterion-evaluator prompts to require verbatim evidence quotes per
      criterion in `backend/src/llm/prompts/builders.py` (depends on: T028)
- [ ] T038 [US2] Strengthen `verify.py` to reject/flag any criterion result whose quotes cannot
      be verified against `essay_text` before persistence in `backend/src/pipeline/verify.py`
      (depends on: T030, T037)

**Checkpoint**: User Stories 1 AND 2 both work independently. Displaying evidence quotes inline
is `002-core-app-ux`'s `AssessmentResult.tsx` component's job — the API already returns them by
the end of this phase.

---

## Phase 5: User Story 3 - Retry after fixing a submission error (Priority: P3)

**Goal**: Rejected or failed submissions return a clear, actionable error from the API.

**Independent Test**: Submit an essay under the minimum word count, confirm a clear rejection
response; simulate a scoring failure and confirm a same-text resubmission succeeds
(quickstart.md Scenarios 3–4) — validated via the API, no client-side state involved.

### Tests for User Story 3 ⚠️

- [ ] T039 [P] [US3] Contract test for `400 BELOW_MIN_WORDS` and `400 UNSCOREABLE` responses in
      `backend/tests/contract/test_assessments_rejection.py`
- [ ] T040 [P] [US3] Integration test: a failed scoring attempt followed by a same-text
      resubmission succeeds, in `backend/tests/integration/test_retry_after_failure.py`

### Implementation for User Story 3

- [ ] T041 [US3] Implement minimum-word-count and unscoreable-content validation, setting
      `status = REJECTED` and returning 400, in `backend/src/api/assessments.py` (depends on:
      T027, T032)

**Checkpoint**: All three user stories are independently functional at the API level. Preserving
the learner's typed text across a failed submission and displaying the rejection/failure message
are `002-core-app-ux`'s responsibilities (its `WorkspaceViewState` already specifies this) — the
API's job, done as of this phase, is to never discard data server-side and to return a clear
error code/message.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Constitution-mandated evaluation methodology, deployment hardening, and final
validation, spanning all user stories.

- [ ] T042 [P] Implement the golden-dataset benchmark harness and metrics (MAE, RMSE, Spearman
      vs. gold labels) in `backend/src/evaluation/harness.py` and `backend/src/evaluation/metrics.py`
      (Constitution Principle IV)
- [ ] T043 [P] Author the initial pipeline config `backend/pipelines/v1.yaml` (prompt
      version, model id, params) per research.md decision 5
- [ ] T044 Run the golden-dataset regression harness against `backend/data/golden/` using
      `backend/pipelines/v1.yaml` and record the baseline run under `backend/data/reports/`
      (depends on: T018, T042, T043)
- [ ] T045 [P] Harden `backend/Dockerfile`/`frontend/Dockerfile` for production and add
      `docker-compose.prod.yml` (Constitution Principle VII)
- [ ] T046 [P] Wire contract, unit, and integration test suites into CI
- [ ] T047 Execute quickstart.md validation Scenarios 1–4 end-to-end (via `curl`/API calls) and
      record results
- [ ] T048 [P] Security review: confirm no secrets are committed, essay text is never logged in
      plaintext, and both endpoints reject unauthenticated requests (Constitution Principle VII)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational completion.
  - US1 (P1) has no dependency on US2/US3.
  - US2 (P2) extends US1's pipeline (T037 depends on T028) — implement after US1 for
    practicality, though its own test (T036) can be written any time after T018.
  - US3 (P3) extends US1's endpoint (T041 depends on T032) — same note.
- **Polish (Phase 6)**: Depends on all desired user stories being complete; T044 additionally
  needs T018/T042/T043.

### Within Each User Story

- Tests (T020–T023, T036, T039–T040) are written and confirmed failing before their
  corresponding implementation tasks (Constitution Principle III).
- Models before pipeline logic before endpoints.
- Story complete and independently checkpointed before moving to the next priority.

### Parallel Opportunities

- All Setup tasks marked [P] (T003–T008) can run in parallel once T001–T002 land.
- Foundational tasks marked [P] (T010–T013, T015, T019) can run in parallel once T009 lands.
- All US1 test tasks (T020–T023) can run in parallel with each other.
- US1 model/schema tasks (T024–T026) can run in parallel with each other.
- Once Foundational is done, US1, US2, and US3 test-writing can start in parallel across
  developers, though US2/US3 implementation tasks have the specific dependencies noted above.

---

## Parallel Example: User Story 1

```bash
# Tests together:
Task: "Contract test for POST /api/v1/assessments in backend/tests/contract/test_assessments_post.py"
Task: "Contract test for GET /api/v1/assessments/{submissionId} in backend/tests/contract/test_assessments_get.py"
Task: "Integration test for full scoring flow in backend/tests/integration/test_score_assessment_flow.py"
Task: "Unit tests for aggregation in backend/tests/unit/test_aggregate.py"

# Models/schemas together:
Task: "Create EssaySubmission model in backend/src/infrastructure/database/models.py"
Task: "Create AssessmentResult model in backend/src/infrastructure/database/models.py"
Task: "Define Pydantic schemas in backend/src/core/schemas.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run quickstart.md Scenario 1 independently (via `curl`/API calls)
5. Move on to `002-core-app-ux` to build the workspace UI against this now-stable API, or
   continue to User Stories 2–3 first — either order is valid since this feature has no UI of its
   own to demo

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. User Story 1 → validate via API → API is ready for `002` to consume (MVP)
3. User Story 2 → validate → deploy (raises explanation credibility)
4. User Story 3 → validate → deploy (reliability/UX polish, at the API level)
5. Phase 6 Polish → golden-dataset baseline, hardened deployment, final quickstart pass

## Notes

- [P] tasks touch different files with no unmet dependencies.
- Constitution Principle III (Test-First) is non-negotiable — do not skip the test tasks.
- Constitution Principle IV requires the golden-dataset regression (T044) before any pipeline
  change ships past this initial baseline.
- This feature builds **zero** frontend pages or components (see Scope note at the top) — do not
  add any `frontend/src/app/` or `frontend/src/components/` tasks here; that work belongs entirely
  to `002-core-app-ux`, which builds the workspace UI exactly once against this feature's stable
  API and its already-specified `WorkspaceViewState` (empty/submitting/result/error, including
  preserving essay text on error and displaying evidence quotes inline).
- Commit after each task or logical group; stop at any checkpoint to validate a story
  independently before continuing.
