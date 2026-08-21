# Feature Specification: IELTS Writing Mock Test Grader

**Feature Branch**: `001-ielts-score-assessment`

**Created**: 2026-08-19
**Revised**: 2026-08-20 — minor wording alignment with `002-core-app-ux`.
**Rewritten**: 2026-08-21 — rescoped from single-essay assessment to a **full mock test grader**
(Task 1 + Task 2 in one timed attempt), and from a four-call criterion-by-criterion pipeline to a
**single grading operation**. Explanations are deferred under constitution **TP-1**. The previous
version of this spec, its plan, tasks, and OpenAPI contract were written against the retired
FastAPI backend and are superseded — see [../README.md](../README.md).

**Status**: Draft

**Input**: User description: "1 request đến và có kết quả từng tiêu chí + overall band. Vẫn kế
thừa pipeline kiểu extract_features + length_penalty => đưa vào prompt duy nhất => LLM => kết quả
từng tiêu chí + overall band => lưu vào database lịch sử bài thi. Thống nhất việc output của nó
trông như thế nào để sau này đồng nhất UI/UX của trang grader."

## Why this rewrite exists

Three things changed since the original spec, and each invalidates part of it:

1. **The product is a mock test, not an essay checker.** A learner now completes Task 1 and
   Task 2 in one timed sitting. Scoring is per task, then combined with the official weighting —
   not one essay in isolation.
2. **Scoring is one operation, not four.** The inherited pipeline asked the model once per
   criterion. This feature asks once, with the extracted features in the prompt, and applies the
   length penalty deterministically afterwards.
3. **The result shape is now a first-class deliverable.** The grader UI has not been designed
   yet. Pinning the result structure here — before any screen exists — is what stops the UI and
   the grader from drifting apart later. The *Result Contract* section below is the part of this
   spec that other features are expected to build against.

## Scope boundary

**In scope**: turning a completed attempt into bands, and persisting that result to the learner's
history in a fixed shape.

**Out of scope**: the exam-taking experience (timer, autosave, editor), authentication, the test
bank, the grader screen's visual design, teach-to-improve guidance, and the progress dashboard.
This feature defines *what a result is*; other features decide how it is produced and shown.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Receive a scored mock test (Priority: P1)

A learner finishes a mock test — Task 1 and Task 2 — and submits it. They see their overall band
alongside a per-task breakdown showing how each of the four criteria scored for each task.

**Why this priority**: This is the product. Everything else in the app exists to lead here or to
follow from here.

**Independent Test**: Submit an attempt containing both tasks and verify the result contains an
overall band, a band for each task, and four criterion bands per task, all on the official scale.

**Acceptance Scenarios**:

1. **Given** a learner has completed both tasks, **When** they submit the attempt, **Then** they
   receive an overall band, a Task 1 band, a Task 2 band, and eight criterion bands (four per
   task), every one of them a valid band value.
2. **Given** an attempt is being scored, **When** the learner waits, **Then** they see an
   explicit in-progress state rather than an empty result or a frozen screen.
3. **Given** a scored attempt, **When** the learner reads the overall band, **Then** it equals
   the official weighting of the two task bands — Task 1 counting one third and Task 2 two
   thirds — and not a plain average of the two.
4. **Given** Task 1 is scored, **When** the learner reads its criteria, **Then** the first
   criterion is labelled **Task Achievement**; for Task 2 the same position is labelled **Task
   Response**, reflecting the different official descriptors.
5. **Given** a scored attempt, **When** the learner views their band, **Then** it is presented as
   a provisional practice estimate, not as an official or diagnostic score (constitution TP-1).

---

### User Story 2 - Review a past attempt (Priority: P1)

A learner opens an attempt they completed earlier and sees exactly the same result, laid out
exactly the same way as when it was first scored.

**Why this priority**: An attempt history nobody can read back is a write-only log. This is also
the requirement that forces the result to be stored in a stable shape rather than reconstructed
differently on each read.

**Independent Test**: Score an attempt, reload it later, and verify the stored result is
structurally identical — same fields, same criterion order, same values.

**Acceptance Scenarios**:

1. **Given** a previously scored attempt, **When** the learner opens it from their history,
   **Then** every band shown matches what was shown at scoring time.
2. **Given** two attempts scored at different times, **When** the learner views both, **Then**
   both present the same fields in the same order, so the two are directly comparable.
3. **Given** an attempt scored before a later change to the scoring method, **When** it is viewed,
   **Then** it still displays correctly and remains attributable to the method that produced it.
4. **Given** a learner is signed in, **When** they request an attempt belonging to someone else,
   **Then** it is not returned to them.

---

### User Story 3 - Recover from a failed scoring run (Priority: P2)

A learner's submission fails to score. They are told plainly, their writing is still there, and
they can try again without rewriting anything.

**Why this priority**: Scoring depends on an external service that will sometimes be slow, rate
limited, or return unusable output. Losing a learner's timed exam writing to a transient failure
is the worst outcome this feature can produce.

**Independent Test**: Force a scoring failure and verify the attempt's text survives intact, the
failure is visible and distinguishable from a low score, and a retry is possible.

**Acceptance Scenarios**:

1. **Given** scoring fails, **When** the learner sees the outcome, **Then** it is clearly a
   failure — never a zero, a blank band, or a partially filled result.
2. **Given** scoring fails, **When** the learner returns to the attempt, **Then** both tasks'
   text is exactly as submitted.
3. **Given** a failed attempt, **When** the learner retries, **Then** the attempt is scored again
   without them re-entering anything.
4. **Given** the grader produces an incomplete result — some criteria missing, **When** the
   outcome is recorded, **Then** it is treated as a failure rather than persisted as a score.

---

### Edge Cases

- **The timer runs out mid-sentence.** Whatever was written is what gets scored; a truncated
  final sentence is normal input, not an error.
- **A task is left completely blank.** Realistic under time pressure, and it must not be treated
  as a system fault. See [NEEDS CLARIFICATION 2].
- **A task is far under the minimum length.** Scored, then penalised on that task's first
  criterion only — not rejected, and not deducted twice (FR-008).
- **The grader returns a band that is not on the scale** — a 6.3, a 12, a negative. Must never
  reach a learner as-is.
- **The grader returns unparseable output** or omits a criterion. Treated as a failed run.
- **The submission is not usable English writing** — gibberish, wrong language, pasted lorem
  ipsum. The learner must be told, rather than shown a fabricated band.
- **The learner submits the same attempt twice**, or double-clicks submit. Must not produce two
  results or two charges against the model budget.
- **A learner submits attempt after attempt** to probe the grader. Must be bounded — every run
  costs real money (constitution Principle V).

## Requirements *(mandatory)*

### Functional Requirements

**Scoring**

- **FR-001**: System MUST accept one completed attempt — Task 1 and Task 2 together — as a single
  submission, and produce one result for it.
- **FR-002**: System MUST score each task against that task's own four official criteria: **Task
  Achievement** (Task 1) or **Task Response** (Task 2), plus Coherence & Cohesion, Lexical
  Resource, and Grammatical Range & Accuracy.
- **FR-003**: System MUST produce a band for every criterion of every task, a band for each task,
  and one overall band for the attempt.
- **FR-004**: System MUST derive each task's band from the mean of that task's four criterion
  bands.
- **FR-005**: System MUST derive the overall band by weighting Task 1 at one third and Task 2 at
  two thirds.
- **FR-006**: System MUST express every band as a multiple of 0.5, rounding a value that falls
  exactly halfway **upward** (so 6.25 becomes 6.5 and 6.75 becomes 7.0), matching IELTS practice.
- **FR-007**: System MUST derive task bands and the overall band by fixed arithmetic, not by
  asking the grader for them. The same criterion bands MUST always produce the same task and
  overall bands.

**Length handling**

- **FR-008**: System MUST count the words in each task and compare that count against the task's
  minimum (150 for Task 1, 250 for Task 2).
- **FR-009**: System MUST apply an under-length penalty to the affected task's **first criterion
  only** (Task Achievement or Task Response), never to the other three and never to the overall
  band directly — mirroring how examiners absorb under-length rather than deducting separately.
- **FR-010**: The penalty MUST be: no penalty at or near the minimum; **0.5 bands** when the task
  is more than 15% short; **1.0 band** when more than 40% short.
- **FR-011**: The penalty MUST be applied by fixed arithmetic after grading, and the grading step
  MUST be instructed **not** to deduct for length itself. These two halves MUST stay in sync —
  if grading also penalises length, every under-length learner is punished twice for one fault.
- **FR-012**: The measured word counts MUST be available to the grading step as context, so it
  can judge development and completeness, even though it does not apply the penalty.

**Result integrity**

- **FR-013**: System MUST NOT present any band that is off the official scale. A band outside the
  valid range or off the half-point grid MUST be corrected onto the scale before it is shown, and
  the fact that a correction was needed MUST be recorded as a quality signal rather than hidden.
- **FR-014**: System MUST treat an incomplete result — any missing criterion — as a failed run.
  A partial result MUST NOT be persisted or displayed as a score.
- **FR-015**: System MUST preserve both tasks' text through any failure, and allow the attempt to
  be scored again without re-entry.
- **FR-016**: System MUST distinguish, in what the learner sees, between *not yet scored*, *being
  scored*, *scored*, and *failed*. A failure MUST never be displayed as a low band.
- **FR-017**: System MUST detect a submission it cannot meaningfully score — not English, not
  writing — and say so, rather than returning an invented band.

**Persistence and traceability**

- **FR-018**: System MUST persist every scored result to the learner's attempt history, in the
  structure defined by the Result Contract below.
- **FR-019**: A stored result MUST be readable later and structurally identical to what was shown
  when it was produced.
- **FR-020**: System MUST record, with every scored attempt, which scoring method and which model
  produced it, so any past band can be traced to the methodology behind it (constitution
  Principle IV).
- **FR-021**: A learner MUST only be able to read their own attempts and results.
- **FR-022**: A learner MUST NOT be able to set or alter their own bands or an attempt's scoring
  state by any route.

**Cost and abuse**

- **FR-023**: System MUST bound how often one learner can trigger scoring (constitution Principle
  V), and MUST NOT score the same submission twice because of a repeated or duplicated request.
- **FR-024**: System MUST record every grading call durably — including the method version, model,
  outcome, duration, size, cost, and the grader's raw output — so scoring quality and spend can be
  examined after the fact (constitution Principle VII).

**Result shape stability** *(the requirement this rewrite exists to pin down)*

- **FR-025**: Every scored attempt MUST present the same fields, in the same order, regardless of
  the bands it received. A high-scoring and a low-scoring attempt MUST be structurally identical.
- **FR-026**: Criteria MUST always be returned in a fixed order — the task's own first criterion,
  then Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy — so a display can
  render them positionally without sorting or lookup.
- **FR-027**: Each criterion MUST carry a stable identifier that does not change when its display
  wording changes, so stored results survive relabelling.
- **FR-028**: The result structure MUST be extensible without alteration: adding per-criterion
  explanations later (closing constitution TP-1) MUST NOT rename, remove, reorder, or change the
  meaning of any field defined here, and MUST NOT require migrating attempts scored before then.
- **FR-029**: Until TP-1 closes, bands MUST be labelled to the learner as provisional practice
  estimates, and MUST NOT be presented as diagnostic feedback or placed behind payment.

### Result Contract

The structure every scored attempt takes. This is the interface the grader screen, the attempt
history, and any later dashboard all build against.

**Attempt result**

| Field | Meaning |
|---|---|
| `attempt_id` | Which attempt this result belongs to |
| `status` | `scored` here; the same field carries `not_started`, `in_progress`, `scoring`, `failed`, `rejected` at other times (FR-016) |
| `overall_band` | The attempt's band, weighted per FR-005 |
| `tasks` | Exactly two task results, Task 1 first (FR-025) |
| `scored_at` | When the result was produced |
| `pipeline_version` | Which scoring method produced it (FR-020) |
| `model_id` | Which model produced it (FR-020) |
| `provisional` | True while TP-1 is active (FR-029) |

**Task result** — exactly two, always in task order

| Field | Meaning |
|---|---|
| `task_number` | 1 or 2 |
| `band` | Mean of this task's four criteria (FR-004) |
| `criteria` | Exactly four, in the fixed order of FR-026 |
| `word_count` | Words measured in this task |
| `minimum_words` | 150 for Task 1, 250 for Task 2 |
| `length_penalty` | `0`, `0.5`, or `1.0` — what was deducted, and from which criterion, made visible rather than silently folded in |

**Criterion result** — exactly four per task, fixed order

| Field | Meaning |
|---|---|
| `code` | Stable identifier, unchanged by relabelling (FR-027) |
| `label` | Display wording |
| `band` | This criterion's band, after any length penalty |
| *(reserved)* | Per-criterion explanation and supporting quotations, added when TP-1 closes (FR-028). Absent, not empty, until then. |

**Criterion codes and order**

| Position | Task 1 | Task 2 |
|---|---|---|
| 1 | `TASK_ACHIEVEMENT` — "Task Achievement" | `TASK_RESPONSE` — "Task Response" |
| 2 | `COHERENCE_COHESION` — "Coherence and Cohesion" | same |
| 3 | `LEXICAL_RESOURCE` — "Lexical Resource" | same |
| 4 | `GRAMMATICAL_RANGE_ACCURACY` — "Grammatical Range and Accuracy" | same |

Position 1 differs between the two tasks. Any display MUST take its wording from the result
rather than assuming a single label for both tasks (User Story 1, scenario 4).

**Failure result** — the shape a display must also handle

| Field | Meaning |
|---|---|
| `attempt_id` | Which attempt |
| `status` | `failed` or `rejected` |
| `reason` | Why, in terms a learner can act on — the grader was unavailable, the submission was not usable writing |
| `retryable` | Whether trying again may succeed without changing anything |

No bands appear in a failure result. A display MUST NOT substitute zeroes or blanks for missing
bands (FR-014, FR-016).

### Key Entities

- **Attempt**: One learner's sitting of one mock test — the two tasks' text, which test was taken,
  when, and its current scoring state. Owned by the mock-test experience feature; this feature
  reads it and writes its result back.
- **Attempt Result**: The bands produced for one attempt, plus what produced them. One per
  successfully scored attempt.
- **Task Result**: One task's outcome within a result — its band, its four criterion bands, and
  the length facts behind any penalty.
- **Criterion Result**: One official criterion's band within one task.
- **Grading Record**: A durable record of one call to the grader — method version, model, outcome,
  duration, size, cost, and raw output (FR-024). Operational and methodological evidence, not
  something a learner sees.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A learner who submits a completed attempt sees a finished result within 60 seconds
  for at least 95% of attempts.
- **SC-002**: On a benchmark set, at least 90% of overall bands fall within 0.5 of the band an
  independent qualified human rater gives the same attempt.
- **SC-003**: 100% of stored results carry a full set of bands — eight criterion bands, two task
  bands, one overall band. No stored result is partial.
- **SC-004**: 100% of stored results share an identical structure — same fields, same criterion
  order — verified across a sample spanning the full band range.
- **SC-005**: 100% of bands shown to learners are valid band values on the official scale.
- **SC-006**: 100% of stored results can be traced to the exact scoring method and model that
  produced them.
- **SC-007**: Given the same criterion bands, the same task bands and the same overall band are
  produced every time, with no variation.
- **SC-008**: Fewer than 2% of submitted attempts fail to produce a result, excluding those
  correctly identified as not scoreable.
- **SC-009**: 100% of failed scoring runs leave the learner's writing fully intact.
- **SC-010**: 0% of attempts belonging to one learner are readable by another, and 0% of attempts
  to set one's own band from outside the grader succeed.
- **SC-011**: 100% of grading calls appear in the durable record with their cost, so spend per
  attempt is known without estimation.

## Assumptions

- **The exam questions are available to the grader.** Task Achievement and Task Response cannot be
  judged without knowing what the learner was asked. See [NEEDS CLARIFICATION 3].
- **Grading happens once per attempt, not once per criterion.** The inherited pipeline made one
  call per criterion; this feature deliberately consolidates that, both for cost (Principle V) and
  because a single view of both tasks is closer to how an examiner reads a script. See
  [NEEDS CLARIFICATION 1] for how far that consolidation goes.
- **The length penalty is arithmetic, not judgement** (FR-011). This follows the inherited
  pipeline, where the grading prompt is explicitly told not to deduct for length so the two do not
  double-count. The pairing is easy to break silently and must be tested as a pair.
- **Band arithmetic follows the inherited implementation**: bands clamp to the 1–9 range and round
  to the nearest half with halfway values going up.
- **Minimum lengths follow standard IELTS convention** — 150 words for Task 1, 250 for Task 2.
- **Submissions are typed or pasted text.** Handwriting or image upload with OCR is out of scope.
- **Essays are expected in English.** Other languages are reported as not scoreable rather than
  translated.
- **Explanations are deferred, not cancelled.** Constitution TP-1 permits bands without
  explanations only during the platform-migration phase; FR-028 exists so closing TP-1 is an
  addition rather than a rewrite.
- **This feature does not own the exam-taking experience.** The timer, autosave, and editor belong
  to the mock-test experience feature. This feature begins at a submitted attempt.
- **A learner is already signed in.** Authentication is a prerequisite, not part of this feature.

## Dependencies

- **The mock-test experience feature** owns the attempt (both tasks' text, the timer, the test
  taken) and is where a submission originates.
- **The Supabase platform feature** owns the attempt history table, the scoring-state field this
  feature transitions, the ownership rules behind FR-021 and FR-022, and the durable grading
  record of FR-024.
- **Constitution TP-1** governs the deferral of explanations. When it closes, FR-028 governs how
  they are added.
