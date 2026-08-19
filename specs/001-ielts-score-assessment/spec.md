# Feature Specification: IELTS Writing Score Assessment & Explainability

**Feature Branch**: `001-ielts-score-assessment`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "Score assessment + explainability — learner submits an essay, gets an IELTS band score per criterion with a rubric-grounded explanation of why the AI judged that score."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get an explained band score for an essay (Priority: P1)

A learner pastes or types an IELTS Writing essay into the app and submits it for scoring. The
system evaluates it against the official IELTS Writing band descriptors and returns an overall
band score plus one score for each of the four criteria (Task Achievement/Response, Coherence &
Cohesion, Lexical Resource, Grammatical Range & Accuracy), each with a plain-language explanation
of why that score was given.

**Why this priority**: This is the entire value proposition of the product. Without a credible,
explained score there is no product to test or grow.

**Independent Test**: Submit a sample essay and verify the response contains an overall band,
four criterion-level bands, and a non-empty, rubric-grounded explanation for each.

**Acceptance Scenarios**:

1. **Given** a learner has written a complete essay for the supported task type, **When** they
   submit it for scoring, **Then** they receive an overall band score and four criterion scores,
   each with an explanation that references specific language from their essay.
2. **Given** a learner submits an essay, **When** scoring completes, **Then** each criterion's
   explanation cites the specific band-descriptor language it corresponds to (e.g. "uses only
   basic vocabulary" for a low Lexical Resource band) rather than generic praise or criticism.

---

### User Story 2 - Understand exactly where points were lost (Priority: P2)

Alongside each criterion's score, the learner can see which specific sentences or passages in
their own essay support that score, so the explanation is anchored to their own writing rather
than being generic feedback.

**Why this priority**: Explainability without evidence anchored in the learner's own text is not
trustworthy or actionable. It substantially raises the credibility of the score, but the MVP
(User Story 1) can ship with criterion-level explanations before quote-level anchoring exists.

**Independent Test**: Submit an essay with a deliberate mix of strong and weak sentences and
verify the returned explanation references the specific weak sentences for the criteria that
scored lower.

**Acceptance Scenarios**:

1. **Given** an essay with an off-topic paragraph, **When** it is scored, **Then** the
   Task Achievement/Response explanation identifies that paragraph as reducing the score.
2. **Given** an essay containing a grammar error, **When** it is scored, **Then** the
   Grammatical Range & Accuracy explanation quotes the specific sentence containing the error.

---

### User Story 3 - Retry after fixing a submission error (Priority: P3)

If scoring fails (e.g. essay too short, a system error during processing), the learner sees a
clear, actionable message and can correct and resubmit without losing what they wrote.

**Why this priority**: Reliability and UX polish — important, but the product delivers its core
value even with a minimal error path.

**Independent Test**: Submit an essay below the minimum word count and verify a clear rejection
message is shown and the learner's typed text is preserved for editing.

**Acceptance Scenarios**:

1. **Given** an essay under the minimum word count for its task, **When** submitted, **Then**
   the system rejects it, states the minimum, and does not discard the learner's text.
2. **Given** a scoring attempt fails due to a system error, **When** the learner retries,
   **Then** their previously entered essay text is still present and resubmission succeeds
   without requiring re-typing.

---

### Edge Cases

- What happens when the submitted essay is far below or above the expected word count for the
  chosen task?
- How does the system handle an essay that is off-topic or unrelated to the given prompt?
- How does the system handle essays not written in English, or containing mostly non-essay
  content (e.g. copy-pasted code, repeated characters, gibberish)?
- What happens when the same essay text is submitted twice in a row?
- How does the system respond if it cannot produce a confident result (e.g. an extremely short
  or ambiguous submission)?
- What happens if a learner submits an essay without indicating whether it is a Task 1 or
  Task 2 response?
- What happens if an unauthenticated visitor tries to submit an essay for scoring?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a learner to submit essay text for scoring by typing or pasting
  it into the application.
- **FR-002**: System MUST score a submitted essay against all four official IELTS Writing
  band-descriptor criteria: Task Achievement/Response, Coherence & Cohesion, Lexical Resource,
  and Grammatical Range & Accuracy.
- **FR-003**: System MUST return an overall band score plus a separate band score for each of
  the four criteria.
- **FR-004**: System MUST provide a plain-language explanation for every criterion score that
  references the specific IELTS band-descriptor language it corresponds to.
- **FR-005**: System MUST support scoring for both IELTS Writing Task 1 (report/letter) and
  Task 2 (essay) at launch, applying the correct rubric for each — Task Achievement for Task 1,
  Task Response for Task 2 — with Coherence & Cohesion, Lexical Resource, and Grammatical Range
  & Accuracy scored the same way for both.
- **FR-005a**: System MUST require the learner to indicate which task (1 or 2) an essay is
  responding to before or during submission, so the correct rubric is applied.
- **FR-006**: System MUST reject essays below the minimum word count for the selected task,
  state the minimum to the learner, and preserve their entered text rather than discarding it.
- **FR-007**: System MUST detect submissions that are not usable for scoring (e.g. empty,
  non-English, or not recognizable as essay writing) and reject them with a clear explanation
  of why.
- **FR-008**: System MUST require a learner to have a signed-in account before they can submit
  an essay for scoring.
- **FR-009**: System MUST preserve the learner's entered essay text if a scoring attempt fails,
  so it can be resubmitted without retyping.
- **FR-010**: System MUST let the learner view the full explanation behind each criterion score,
  not just its numeric band.
- **FR-011**: System MUST clearly label which of the four criteria each explanation applies to,
  so a learner viewing all four together cannot confuse them.
- **FR-012**: System MUST NOT display a band score, overall or per-criterion, without an
  accompanying explanation.

### Key Entities

- **Essay Submission**: The text a learner submits for scoring, the task type it targets, and
  when it was submitted.
- **Assessment Result**: The outcome produced for one essay submission — an overall band score,
  linked to that submission.
- **Criterion Score**: One of the four IELTS rubric criteria within an assessment result, its
  band score, and its explanation.
- **Rubric Descriptor**: The official IELTS band-descriptor language a criterion score's
  explanation is grounded in.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A learner receives a complete scored result (overall band, four criterion bands,
  and explanations) within 60 seconds for at least 95% of submissions.
- **SC-002**: At least 90% of a benchmark set of essays scored by the system fall within 0.5
  band of the score an independent qualified human rater gives the same essay.
- **SC-003**: In a review of a sample of assessments, at least 95% of criterion explanations
  reference specific language from the learner's own essay rather than generic commentary.
- **SC-004**: At least 90% of learners in a usability review report they understood why they
  received their score after reading the explanation.
- **SC-005**: Fewer than 2% of essay submissions fail to produce a usable result, excluding
  submissions correctly rejected for being unscoreable (e.g. under the minimum word count).

## Assumptions

- Learners submit essay text directly (typed or pasted); image/handwriting upload with OCR is
  out of scope for this feature.
- Essays are assumed to be written in English; non-English submissions are rejected rather than
  translated or scored.
- Minimum word counts follow standard IELTS conventions (150 words for Task 1, 250 words for
  Task 2) unless the learner is told a different minimum.
- This feature covers scoring and per-essay explanation only. Turning weak sentences into strong
  ones (the teach-to-improve guidance) and tracking score history over time (the progress
  dashboard) are separate features and out of scope here.
- One essay is scored per submission; bulk/batch essay upload is out of scope for this feature.
- Account creation and sign-in themselves (the auth flow) are a prerequisite, not part of this
  feature's scope; this feature assumes an authenticated learner already exists when a submission
  is made.
