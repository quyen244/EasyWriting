# Phase 1 Data Model: IELTS Writing Score Assessment & Explainability

Entities below map directly to the spec's Key Entities section. Per [research.md](./research.md)
decision 4, the four per-assessment criterion scores are stored as a JSONB array, not a separate
table.

## Account (`users`)

Prerequisite entity, owned by the (out-of-scope) auth feature — `003-account-authentication` is
its authoritative owner and extends this table with authentication-relevant columns. Referenced
here only by foreign key. Named `Account` (not `Learner`) to match the canonical name used
everywhere else in the project (`/speckit-analyze` finding I2); the SQLAlchemy model class built
by task T010 below MUST be named `Account`.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| email | text, unique | |
| created_at | timestamptz | |

## EssaySubmission (`essay_submissions`)

Represents FR-001/FR-005/FR-005a/FR-006/FR-007: the text a learner submits, its task type, and
its outcome.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users.id) | required — FR-008 |
| task_type | enum: `TASK_1`, `TASK_2` | required — FR-005a |
| prompt_text | text, nullable | the exam prompt/topic the essay responds to, if supplied |
| essay_text | text | required, non-empty |
| word_count | integer | computed at submission time |
| status | enum: `SCORED`, `REJECTED`, `FAILED` | terminal per submission attempt — see State Transitions |
| rejection_reason | enum, nullable: `BELOW_MIN_WORDS`, `UNSCOREABLE` | set only when status = `REJECTED` (FR-006, FR-007) |
| submitted_at | timestamptz | |

**Validation rules**:
- `essay_text` MUST be non-empty and pass a basic English/essay-shape check (FR-007); otherwise
  `status = REJECTED`, `rejection_reason = UNSCOREABLE`, and no `AssessmentResult` is created.
- `word_count` MUST be ≥ 150 (Task 1) or ≥ 250 (Task 2) (Assumptions); otherwise
  `status = REJECTED`, `rejection_reason = BELOW_MIN_WORDS`.
- `task_type` is required on every submission (FR-005a).

## AssessmentResult (`assessment_results`)

Represents FR-002/FR-003/FR-004/FR-011/FR-012: the scored outcome of one `EssaySubmission`,
1:1 with a submission whose `status = SCORED`.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| submission_id | UUID (FK → essay_submissions.id, unique) | 1:1 |
| overall_band | numeric(2,1) | e.g. 6.5; half-band increments |
| criteria | JSONB | array of 4 `CriterionScore` objects — see below |
| pipeline_version | text | which `pipelines/*.yaml` config produced this result (Constitution IV) |
| model_used | text | OpenRouter model id actually used |
| created_at | timestamptz | |

**Validation rules**:
- `criteria` MUST contain exactly 4 entries, one per criterion enum value, matching `task_type`'s
  rubric (`TASK_ACHIEVEMENT` for Task 1 vs. `TASK_RESPONSE` for Task 2 — FR-005).
- `overall_band` and every criterion `band` MUST be a valid IELTS band (1.0–9.0 in 0.5 steps).
- No `AssessmentResult` may be created with a missing `explanation` on any criterion entry
  (Constitution I / FR-012 — enforced at the pipeline layer before persistence, not just at read
  time).

### CriterionScore (embedded object, within `AssessmentResult.criteria`)

Represents FR-004/FR-011: one of the four rubric criteria within an assessment.

| Field | Type | Notes |
|---|---|---|
| criterion | enum: `TASK_ACHIEVEMENT` \| `TASK_RESPONSE` \| `COHERENCE_COHESION` \| `LEXICAL_RESOURCE` \| `GRAMMATICAL_RANGE_ACCURACY` | unambiguous label (FR-011) |
| band | numeric | 1.0–9.0, 0.5 steps |
| explanation | text | plain-language, references descriptor language (FR-004) |
| evidence_quotes | array of text | passages quoted verbatim from `essay_text`, verified against the source (User Story 2) |
| descriptor_reference | text | id/slug of the specific band-descriptor line the explanation is grounded in (Constitution I) |

## RubricDescriptor (static reference data, not a DB table)

Represents the official IELTS band-descriptor text, versioned as files under
`backend/src/llm/rubrics/` (Constitution I: "prompts, rubrics... are versioned artifacts").
`CriterionScore.descriptor_reference` points into this reference data. Not persisted per-row in
the database — it is shared, immutable content, not per-assessment data.

## State Transitions

`EssaySubmission.status` is set once, at creation of the response, and is terminal for that
attempt:

```
(new submission) ──validate──▶ REJECTED   (word count / unscoreable — no AssessmentResult)
                  │
                  └─validate OK─▶ run pipeline ──success──▶ SCORED (+ AssessmentResult created)
                                              └─error──────▶ FAILED (no AssessmentResult)
```

Per FR-009, a retry after `FAILED` or a correction after `REJECTED` is a **new** `POST` (a new
`EssaySubmission` row); the learner's typed text is preserved client-side in the frontend, not by
mutating the failed/rejected row. This keeps the backend state machine simple (Constitution VI) —
no in-place retry transition to implement or test.
