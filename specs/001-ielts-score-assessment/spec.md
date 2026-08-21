# Feature Specification: WriteWise Grader — Single-Task IELTS Writing Assessment

**Feature Branch**: `001-ielts-score-assessment`

**Created**: 2026-08-19
**Rewritten**: 2026-08-21 — scoped to the **standalone grader**: one task per request, `task_type`
supplied by the caller, one LLM call. Design reference: [../../design/grader.png](../../design/grader.png).
The previous version of this spec described a four-call pipeline on a FastAPI backend that no
longer exists; an intermediate draft mistakenly described a full mock test. Both are superseded.

**Status**: Draft

**Design decisions confirmed with the product owner on 2026-08-21**: per-criterion comments are in
scope; comments are bilingual; sign-in is required; the grading function persists a row and returns
the result in the same call.

---

## 1. Problem / Goal

An IELTS learner writing on their own has no way to know what band their writing would receive, or
why. Human feedback costs money and takes days, so most learners practise blind — they produce
essays without ever learning which of the four assessed criteria is actually holding their score
down.

**Goal**: a learner pastes one piece of writing, picks which task it answers, and within about a
minute receives an estimated band for each of the four official criteria, an overall band, and a
plain-language comment explaining each criterion's band — with every band traceable to the exact
prompt and model that produced it.

---

## 2. Scope

- Assessing **one task per request**. The caller states which task type via `task_type`.
- Both IELTS Academic Writing task types: **Task 1** (minimum 150 words) and **Task 2** (minimum
  250 words).
- An optional exam prompt supplied by the learner.
- Deterministic pre-processing: a scoreability gate and feature extraction.
- Exactly **one** LLM call per graded submission.
- Deterministic post-processing: band snapping, the under-length penalty, and overall aggregation.
- Persisting every submission and its outcome — including failures — to the learner's history.
- Recording every LLM call for cost and quality analysis.

## 3. Non-goals

- **The full mock test** (Task 1 + Task 2 in one timed 60-minute sitting). A separate feature, with
  its own specification, reached from the "Thi thử đầy đủ" card on the grader page. It will reuse
  this feature's pipeline rather than reimplement it — see §16.
- **Teach-to-improve guidance** — rewriting a learner's weak sentences into strong ones
  (constitution Principle II). This feature explains a band; it does not coach.
- **The progress dashboard** — trends across submissions over time.
- **Authentication itself.** A signed-in learner is a precondition.
- **IELTS General Training.** Its Task 1 uses different descriptors — see §17.
- **Handwriting or image upload.** Text only.
- **Verbatim evidence-quote verification.** Comments reference the learner's writing but are not
  machine-verified as exact quotations — see §17.

---

## 4. User Scenarios & Testing *(mandatory)*

### User Story 1 - Grade one piece of writing (Priority: P1)

A learner opens the grader, chooses Task 1 or Task 2, optionally pastes the exam prompt, pastes
their writing, and submits. They receive four criterion bands with a comment on each, plus an
overall band.

**Why this priority**: This is the feature. Nothing else here has value without it.

**Independent Test**: Submit a Task 2 essay of adequate length and verify the result contains four
criterion bands, four non-empty comments, and an overall band, all on the official scale.

**Acceptance Scenarios**:

1. **Given** a signed-in learner with Task 2 selected and an essay of at least 250 words, **When**
   they submit, **Then** they receive four criterion bands, a comment for each, and an overall band.
2. **Given** Task 1 is selected, **When** the result is shown, **Then** the first criterion is
   labelled **Task Achievement**; with Task 2 selected the same position is labelled **Task
   Response**.
3. **Given** a submission is being graded, **When** the learner waits, **Then** an explicit
   in-progress state is shown rather than a blank or frozen result area.
4. **Given** a result is displayed, **When** the learner reads the overall band, **Then** it is the
   average of the four criterion bands rounded to the nearest half band, not a figure the model
   volunteered.
5. **Given** the learner selects Task 1, **When** the form updates, **Then** the stated minimum
   changes to 150 words and the live word counter compares against that minimum.

---

### User Story 2 - Understand why the band was given (Priority: P1)

Each criterion band arrives with a comment written for a Vietnamese learner, explaining in Vietnamese
what in their writing produced that band, while keeping the official IELTS terminology in English.

**Why this priority**: A bare number tells a learner nothing they can act on, and the grader page
explicitly promises detailed comments against the four criteria. Constitution Principle I makes an
unexplained band a defect, not a simplification.

**Independent Test**: Grade an essay with a deliberate mix of strengths and weaknesses and verify
each comment refers to that essay's actual characteristics rather than generic advice.

**Acceptance Scenarios**:

1. **Given** a graded submission, **When** the learner reads any criterion's comment, **Then** it
   refers to identifiable features of their own writing rather than generic praise or criticism.
2. **Given** a graded submission, **When** the learner reads a comment, **Then** the explanation is
   in Vietnamese while criterion names and IELTS descriptor wording remain in English.
3. **Given** a submission that scored below the length minimum, **When** the learner reads the
   result, **Then** the deduction is stated explicitly — how many words short, how much was
   deducted, and from which criterion — rather than silently folded into the band.
4. **Given** any displayed band, **When** the learner sees it, **Then** it is presented as an
   estimate for practice, not as an official IELTS result.

---

### User Story 3 - Revisit past submissions (Priority: P2)

A learner opens "Lịch sử" and sees their previous submissions, and can reopen any one to see the
writing they submitted alongside the result it received.

**Why this priority**: The sidebar already offers it, and a grader with no history makes a learner
retype work to compare. It is P2 because the grader delivers value on its first use without it.

**Independent Test**: Grade two submissions, open the history, and verify both appear with the same
bands they were originally given.

**Acceptance Scenarios**:

1. **Given** previous submissions, **When** the learner opens the history, **Then** each entry shows
   its task type, overall band, and when it was graded.
2. **Given** a past submission, **When** the learner opens it, **Then** the writing and the full
   result are exactly as first produced.
3. **Given** a learner is signed in, **When** they attempt to open a submission belonging to another
   learner, **Then** it is not returned.

---

### User Story 4 - Recover from a failed grading (Priority: P2)

Grading fails. The learner is told plainly, their writing is intact, and they can retry.

**Why this priority**: Grading depends on an external model that will sometimes be slow, rate
limited, or return unusable output. Losing a learner's writing to a transient fault is the worst
outcome this feature can produce.

**Independent Test**: Force a model failure and verify the writing survives, the failure is
distinguishable from a low band, and a retry succeeds.

**Acceptance Scenarios**:

1. **Given** grading fails, **When** the outcome is shown, **Then** it is unmistakably a failure —
   never a zero, a blank band, or a partly filled result.
2. **Given** grading fails, **When** the learner returns, **Then** their writing is exactly as
   submitted.
3. **Given** the model returns only three of four criteria, **When** the outcome is recorded,
   **Then** it is treated as a failure rather than stored as a band.
4. **Given** the learner loses their connection while grading runs, **When** they return,
   **Then** the completed result is available — they are not charged a second grading run for work
   already done.

---

### Edge Cases

- **Empty submission**, or a few stray characters. Rejected before any model call, at no cost.
- **Writing that is not English** — Vietnamese, or pasted placeholder text. Rejected before any
  model call.
- **Far under the minimum length.** Graded, then penalised on the first criterion only — not
  rejected, and never deducted twice (§9).
- **No prompt supplied.** Permitted; the grader page marks the field optional. Task
  Achievement/Response is then judged with less certainty, and the result must say so (§17).
- **The model returns a band off the scale** — a 6.3, a 12, a negative number. Must never reach a
  learner unaltered.
- **The model returns unparseable output**, or omits a criterion. A failed run.
- **"Chấm điểm ngay" pressed twice**, or the request retried. Must not produce two results or two
  charges.
- **A learner submits repeatedly** to probe the grader. Bounded — every run costs real money.
- **Extremely long input** — a pasted book chapter. Bounded before it reaches the model.

---

## 5. User flow

```
Sign in ──▶ "Chấm bài" ──▶ choose task type (Task 1 / Task 2)
                              │  minimum words and word counter update
                              ▼
                        paste prompt (optional)
                              ▼
                        paste writing — live count "N / min từ"
                              ▼
                        "Chấm điểm ngay"
                              ▼
                     in-progress state shown
                              ▼
              ┌───────────────┴───────────────┐
              ▼                               ▼
      four criterion cards               failure notice
      (band + comment each)              reason + retry
      overall band                       writing preserved
      length deduction if any
              │
              └──▶ saved to "Lịch sử"
```

"Làm mới" clears the form without submitting. The "Thi thử đầy đủ" card leaves for the separate
mock-test feature.

---

## 6. Grader flow

```
① GATE       deterministic, before any spend
             rate limit → empty? → below absolute minimum? → not English?
             fail ⇒ rejected, error code, zero model calls

② PERSIST    create the submission row, status = scoring
             writing is durable from this point on

③ EXTRACT    word count, minimum for the task, sentences, paragraphs,
             cohesive devices, repeated content words
             ⇒ supplied to the model as ground truth

④ JUDGE      ONE model call — semantic assessment only
             explicitly instructed NOT to deduct for length
             fail ⇒ one retry ⇒ failed

⑤ SNAP       every band clamped to the scale and onto the half-band grid;
             any correction recorded as a model-quality signal

⑥ ADJUST     under-length penalty applied to the FIRST criterion only

⑦ AGGREGATE  overall = mean of the four bands, rounded to the nearest half

⑧ COMPLETE   store the result, record the model call, return to the caller
```

**The governing rule: the model never counts and never calculates.** Counting is what language
models fail at most reliably, and arithmetic performed by a model is neither reproducible nor
auditable. Steps ① ③ ⑤ ⑥ ⑦ exist to keep both out of the model's hands. The only thing the model
produces is four bands and four comments.

---

## 7. Supported `task_type`

| `task_type` | Minimum words | First criterion | Rubric |
|---|---|---|---|
| `TASK_1` | 150 | `TASK_ACHIEVEMENT` — "Task Achievement" | Academic Task 1 descriptors |
| `TASK_2` | 250 | `TASK_RESPONSE` — "Task Response" | Task 2 descriptors |

Criteria 2–4 are identical for both: Coherence & Cohesion, Lexical Resource, Grammatical Range &
Accuracy.

`task_type` determines three things — the minimum word count, the identity of the first criterion,
and which rubric text enters the prompt. These three MUST be resolved from a single mapping rather
than being decided independently wherever they are needed (§17).

---

## 8. Request schema

```jsonc
{
  "task_type":   "TASK_1" | "TASK_2",   // required
  "essay_text":  "string",              // required, non-empty
  "prompt_text": "string" | null        // optional — the page marks it "Không bắt buộc"
}
```

The learner's identity is taken from their session, never from the request body.

---

## 9. Preprocessing / feature extraction

**Gate** — runs before anything is charged for:

| Check | Outcome |
|---|---|
| Rate limit exceeded | `RATE_LIMITED` |
| Empty or whitespace only | `EMPTY_SUBMISSION` |
| Below the absolute floor (20 words) — nothing assessable regardless of task | `TOO_SHORT` |
| Not predominantly Latin-script English | `NOT_ENGLISH` |
| Beyond the maximum accepted length | `TOO_LONG` |

**Extraction** — measured facts passed into the prompt as ground truth: word count, the task's
minimum, sentence and paragraph counts, cohesive devices found, and repeated content words.

**Under-length penalty** — computed here, applied at step ⑥:

| Shortfall against the minimum | Deduction |
|---|---|
| Up to 15% short | none |
| More than 15% short | **0.5 band** |
| More than 40% short | **1.0 band** |

Applied to the **first criterion only** (Task Achievement or Task Response), never to the other
three and never to the overall band directly. This mirrors how examiners absorb under-length into
that criterion instead of deducting separately.

⚠️ **This deduction and the prompt are two halves of one arrangement.** The prompt MUST instruct
the model not to deduct for length itself. If both apply a penalty, every under-length learner is
punished twice for one fault — and nothing surfaces the error, because the resulting band still
looks plausible. The pairing MUST be covered by a test that fails if either half changes alone.

---

## 10. LLM evaluation step

Exactly one call per graded submission. The prompt carries:

- the role of an IELTS examiner and the descriptors **for the requested task type only**;
- the exam prompt, if the learner supplied one — and, if not, an instruction to judge the first
  criterion on internal coherence and completeness while flagging reduced certainty;
- the learner's writing;
- the extracted measurements as ground truth;
- the instruction **not** to deduct for length;
- the required output shape, and the requirement that comments explain in Vietnamese while keeping
  IELTS terminology in English.

The model, its parameters, and the prompt version come from versioned configuration, never from
code (constitution Principles IV and V).

---

## 11. LLM output contract

The model returns **only** what requires judgement:

```jsonc
{
  "criteria": [
    { "code": "TASK_RESPONSE",              "band": 6.5, "comment": "…" },
    { "code": "COHERENCE_COHESION",         "band": 6.0, "comment": "…" },
    { "code": "LEXICAL_RESOURCE",           "band": 6.5, "comment": "…" },
    { "code": "GRAMMATICAL_RANGE_ACCURACY", "band": 6.0, "comment": "…" }
  ]
}
```

The model MUST NOT return the overall band (calculated), the display labels (mapped from `code`),
or any length deduction (applied afterwards). Everything derivable is derived, so every number in
the stored result except the four raw bands can be reproduced from the inputs.

**Rejected if**: the JSON does not parse; any of the four expected codes is missing; a code is
unrecognised; a band is absent or non-numeric; a comment is empty. One retry, then failure.

---

## 12. Result schema

```jsonc
{
  "id": "uuid",
  "task_type": "TASK_2",
  "status": "scored",
  "overall_band": 6.5,
  "criteria": [
    { "code":  "TASK_RESPONSE",
      "label": "Task Response",
      "band":  6.5,
      "comment": "Bài viết trả lời được cả hai phần của đề, nhưng phần giải pháp
                  chỉ dừng ở mức khái quát — thiếu ví dụ cụ thể. Đây là đặc điểm
                  của band 6: \"addresses all parts of the task though some parts
                  may be more fully covered than others\"." }
    // …three more, always in the order of §7
  ],
  "word_count": 243,
  "min_words": 250,
  "length_penalty": 0,
  "provisional": true,
  "pipeline_version": "pipeline-v1.0",
  "model_id": "…",
  "created_at": "…",
  "scored_at": "…"
}
```

**Why `criteria` is an ordered array of objects, not a keyed map**: an array preserves display
order; a `code` keeps each criterion identifiable when its wording changes; and the `label` travels
with the result because the first criterion's name **differs between task types**. A display that
assumed one name for position 1 would mislabel half of all results.

**Failure result** — the shape a display must also handle:

```jsonc
{ "id": "uuid", "task_type": "TASK_2", "status": "failed",
  "error_code": "LLM_INVALID_OUTPUT",
  "message": "…", "retryable": true }
```

No bands appear in a failure result. A display MUST NOT substitute zeroes or blanks for missing
bands.

---

## 13. Database schema

> Included at the product owner's explicit request so the storage design is agreed before planning.

```sql
-- One assessed task. Readable by its owner.
create table public.grader_results (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  source           text not null default 'grader'
                   check (source in ('grader','mock_test')),

  -- input
  task_type        text not null check (task_type in ('TASK_1','TASK_2')),
  prompt_text      text,                    -- nullable: optional on the page
  essay_text       text not null,

  -- deterministic features
  word_count       int  not null check (word_count >= 0),
  min_words        int  not null,           -- snapshot, so old rows explain themselves
  length_penalty   numeric(2,1) not null default 0
                   check (length_penalty in (0, 0.5, 1.0)),

  -- job state
  status           text not null default 'queued'
                   check (status in ('queued','scoring','scored','failed','rejected')),
  error_code       text,

  -- result
  overall_band     numeric(2,1)
                   check (overall_band is null or
                          (overall_band between 1 and 9 and
                           overall_band * 2 = floor(overall_band * 2))),
  criteria         jsonb,

  -- traceability (Principle IV)
  pipeline_version text,
  prompt_version   text,
  model_id         text,

  created_at       timestamptz not null default now(),
  scored_at        timestamptz,

  -- a scored row is never partial
  constraint scored_rows_are_complete check (
    status <> 'scored' or
    (overall_band is not null and criteria is not null
     and jsonb_array_length(criteria) = 4
     and pipeline_version is not null and model_id is not null)
  )
);

create index on public.grader_results (user_id, created_at desc);

-- Every model call. Service-role only; never exposed to a learner.
create table public.llm_calls (
  id                uuid primary key default gen_random_uuid(),
  grader_result_id  uuid references public.grader_results(id) on delete cascade,
  user_id           uuid references auth.users(id),
  pipeline_version  text not null,
  prompt_version    text not null,
  model_id          text not null,
  status            text not null,     -- ok | parse_error | timeout | rate_limited | http_error
  latency_ms        int,
  prompt_tokens     int,
  completion_tokens int,
  cost_usd          numeric(10,6),
  retry_count       int not null default 0,
  bands_coerced     boolean not null default false,
  raw_response      jsonb,             -- purged on a schedule (Principle VII)
  error_message     text,
  created_at        timestamptz not null default now()
);
```

**Access control** — enforced in the database, not in application code:

```sql
alter table public.grader_results enable row level security;
alter table public.llm_calls      enable row level security;   -- no policy: service_role only

create policy "read own"   on public.grader_results
  for select to authenticated using (auth.uid() = user_id);
create policy "insert own" on public.grader_results
  for insert to authenticated with check (auth.uid() = user_id);

-- RLS makes the row theirs, which would otherwise let a learner set their own band to 9.0.
revoke update (overall_band, criteria, status, error_code,
               length_penalty, pipeline_version, prompt_version, model_id)
  on public.grader_results from authenticated;
```

The `scored_rows_are_complete` constraint and the band-grid check are deliberate: they make an
invalid result **unstorable**, so a defect in the grading code surfaces as a rejected write instead
of a wrong band shown to a learner.

**Why the raw model response lives in a separate table**: it has a different retention life (it
embeds the learner's writing and must be purged on a schedule), a different audience (service role
only, never the learner), and it must exist even when there is no result row to attach it to —
a failed call is precisely the record most worth keeping.

**Why `criteria` is JSONB rather than a normalized table**: the four criteria are always written
together, always read together, and are never queried individually at this stage — a join would be
paid on every read to buy nothing. Adding evidence quotes or rewrite suggestions later then costs
no migration. The trade-off is accepted knowingly: when the progress dashboard needs per-criterion
aggregation, a generated column or view is added **then**.

---

## 14. Persistence flow

```
① gate fails      ─▶ insert row  status = 'rejected' + error_code       no model call
② gate passes     ─▶ insert row  status = 'scoring'                     writing now durable
④ model fails     ─▶ update      status = 'failed'  + error_code
                     insert llm_calls (the failure is recorded too)
⑧ success         ─▶ update      status = 'scored', criteria, overall_band,
                                 length_penalty, pipeline_version,
                                 prompt_version, model_id, scored_at
                     insert llm_calls (ok, with latency, tokens, cost)
                  ─▶ return the result to the caller
```

The row is written **before** the model call, so a lost connection or a timeout never costs the
learner their writing or hides a completed grading. The caller receives the result directly from
the same invocation; the stored row is what makes that convenience non-essential rather than
load-bearing.

---

## 15. Requirements *(mandatory)*

### Functional Requirements

**Grading**

- **FR-001**: System MUST accept one submission consisting of a task type, writing, and an optional
  prompt, and produce one result for it.
- **FR-002**: System MUST assess the submission against the four official criteria for the stated
  task type, using Task Achievement for Task 1 and Task Response for Task 2.
- **FR-003**: System MUST produce a band and a comment for each of the four criteria, plus one
  overall band.
- **FR-004**: System MUST derive the overall band from the mean of the four criterion bands, and
  MUST NOT accept an overall band offered by the model.
- **FR-005**: System MUST express every band as a multiple of 0.5 within the 1–9 range, rounding a
  value falling exactly halfway **upward**, so 6.25 becomes 6.5 and 6.75 becomes 7.0.
- **FR-006**: System MUST use exactly one model call per graded submission.
- **FR-007**: Given the same four criterion bands, the system MUST always produce the same overall
  band.

**Length**

- **FR-008**: System MUST count the words in the submission and compare that count with the
  minimum for the stated task type — 150 for Task 1, 250 for Task 2.
- **FR-009**: System MUST deduct 0.5 bands when the submission is more than 15% below the minimum
  and 1.0 band when more than 40% below, applying the deduction to the first criterion only.
- **FR-010**: The deduction MUST be applied by fixed arithmetic after assessment, and the
  assessment step MUST be instructed not to deduct for length itself.
- **FR-011**: System MUST make the measured word count available to the assessment step as ground
  truth rather than leaving it to be counted.
- **FR-012**: System MUST show the learner any deduction applied, including how far short the
  submission was and which criterion absorbed it.

**Comments**

- **FR-013**: Every criterion band MUST be accompanied by a non-empty comment explaining it.
- **FR-014**: Comments MUST refer to identifiable characteristics of the learner's own writing
  rather than generic advice.
- **FR-015**: Comments MUST be written in Vietnamese while retaining IELTS criterion names and
  descriptor wording in English.
- **FR-016**: A band MUST NOT be displayed without its comment.

**Integrity**

- **FR-017**: System MUST NOT present a band that is off the official scale; an off-scale value
  MUST be corrected onto the scale before display, and the correction MUST be recorded as a
  model-quality signal rather than silently discarded.
- **FR-018**: System MUST treat a result missing any criterion as a failure, and MUST NOT store or
  display it as a band.
- **FR-019**: System MUST preserve the learner's writing through any failure and permit a retry
  without re-entry.
- **FR-020**: System MUST distinguish, in what the learner sees, between in progress, graded,
  failed, and rejected — and MUST NOT render a failure as a low band.
- **FR-021**: System MUST reject a submission it cannot meaningfully assess before making any model
  call, and MUST tell the learner why.

**Persistence and access**

- **FR-022**: System MUST persist every submission — rejected, failed, and graded alike — to the
  learner's history.
- **FR-023**: A stored result MUST be readable later and identical to what was first shown.
- **FR-024**: System MUST record the pipeline version, prompt version, and model with every graded
  submission.
- **FR-025**: A learner MUST be signed in to submit, and MUST be able to read only their own
  submissions.
- **FR-026**: A learner MUST NOT be able to set or alter any band, deduction, or status by any
  route, including direct data access.
- **FR-027**: System MUST record every model call durably — version, model, outcome, duration,
  token counts, cost, retries, and the raw response.

**Cost**

- **FR-028**: System MUST limit how often one learner can trigger grading.
- **FR-029**: System MUST NOT charge two model calls for one submission because a request was
  repeated or retried.
- **FR-030**: System MUST bound accepted input length before it reaches the model.

**Shape stability**

- **FR-031**: Every graded result MUST carry the same fields in the same order regardless of the
  bands awarded.
- **FR-032**: Criteria MUST always appear in the fixed order of §7, so a display can render them
  positionally.
- **FR-033**: Each criterion MUST carry a stable code that does not change when its display wording
  changes.
- **FR-034**: Adding evidence quotations or rewrite suggestions later MUST NOT rename, remove,
  reorder, or change the meaning of any field defined here, nor require migrating existing rows.

### Key Entities

- **Grader Result**: One assessed task — the writing, the prompt if given, the measured features,
  the four criterion outcomes, the overall band, and what produced them.
- **Criterion Result**: One official criterion's band and comment within a result.
- **LLM Call**: A durable record of one model call — version, model, outcome, timing, size, cost,
  and raw response. Operational evidence, not learner-facing.

---

## 16. Acceptance criteria / Success Criteria *(mandatory)*

- **SC-001**: A learner submitting valid writing receives a complete result within 60 seconds for
  at least 95% of submissions.
- **SC-002**: On the benchmark dataset, at least 90% of overall bands fall within 0.5 of the band
  an independent qualified human rater assigns the same writing.
- **SC-003**: 100% of stored graded results contain four criterion bands, four non-empty comments,
  and an overall band. No stored result is partial.
- **SC-004**: 100% of graded results share an identical field structure and criterion order,
  verified across a sample spanning the full band range and both task types.
- **SC-005**: 100% of bands shown are valid values on the official scale.
- **SC-006**: 100% of graded results can be traced to the exact pipeline version, prompt version,
  and model that produced them.
- **SC-007**: The overall band is reproducible from the four criterion bands in 100% of cases.
- **SC-008**: Submissions rejected at the gate consume zero model calls, verified across every
  rejection reason.
- **SC-009**: Fewer than 2% of accepted submissions fail to produce a result.
- **SC-010**: 100% of failures leave the learner's writing intact and retryable.
- **SC-011**: 0% of submissions are readable by a learner other than their owner, and 0% of
  attempts to alter one's own band from outside the grading function succeed.
- **SC-012**: 100% of model calls appear in the durable record with their cost, so spend per
  submission is known without estimation.
- **SC-013**: In a usability review, at least 90% of learners report they understood why they
  received their band after reading the comments.
- **SC-014**: A submission 40% below the minimum receives exactly a 1.0-band deduction on the first
  criterion and no deduction elsewhere, verified for both task types.

---

## 17. Extensibility considerations

**The mock test reuses this pipeline.** The `source` column exists from the start so the timed
Task 1 + Task 2 feature creates **two `grader_results` rows** and references them, rather than
implementing a second grading path that would drift from this one. Adding it requires no change
here.

**Comments grow into full feedback.** `criteria[]` entries can gain `evidence_quotes` and rewrite
suggestions without touching any existing field (FR-034), which is what makes the teach-to-improve
feature an addition rather than a rewrite.

**IELTS General Training.** Its Task 1 is a letter, assessed against different descriptors, so
`TASK_1` would become ambiguous if it were added. It is out of scope now, and the mitigation is
cheap: the mapping of §7 must live in **one** place, so a new task type is a new row in that
mapping rather than an edit scattered across the prompt builder, the validator, and the UI.

**Per-criterion analytics.** JSONB is queryable but clumsy for trend analysis. When the progress
dashboard needs it, a generated column or materialized view is added then — deliberately not now.

**Prompt and model iteration.** Because `pipeline_version` and `prompt_version` are stored per row,
two versions can run side by side and be compared on real submissions, which is how the benchmark
dataset grows beyond its current ten samples.

**JSONB has no schema.** Nothing prevents a later version writing a differently shaped object. The
stored `pipeline_version` is the mitigation — it identifies which shape a row follows — and is
therefore required, not optional.

---

## 18. Architecture decisions

| # | Decision | Rationale |
|---|---|---|
| AD-1 | The model never counts and never calculates | Counting is a reliable model failure; model-performed arithmetic is neither reproducible nor auditable. Only the four bands and comments require judgement. |
| AD-2 | One model call per submission | A quarter of the previous pipeline's cost. Four criteria assessed together also lets one weakness inform another, as a human examiner reads. |
| AD-3 | Length deducted deterministically, prompt told not to | Keeps the deduction reproducible and explainable to the learner. The paired instruction prevents double penalisation. |
| AD-4 | `criteria` as an ordered array with stable codes | Preserves display order, survives relabelling, and carries the first criterion's task-dependent name. |
| AD-5 | Raw model responses in a separate table | Different retention, different audience, and must survive when no result row exists. |
| AD-6 | Row written before the model call | The learner's writing and any completed grading survive a lost connection. |
| AD-7 | Result returned in the same call, and persisted | Simple for a caller; the row makes the convenience non-essential and leaves the path to fully asynchronous grading open without a client change. |
| AD-8 | Integrity enforced by database constraints | An invalid result becomes unstorable, so a grading defect surfaces as a rejected write instead of a wrong band shown to a learner. |
| AD-9 | Score columns revoked from the learner role | RLS makes the row theirs, which would otherwise permit setting their own band. |
| AD-10 | Sign-in required | Simple ownership, per-user rate limiting, and a history that always has an owner. |

---

## 19. Assumptions

- Word-count minimums follow standard IELTS convention: 150 for Task 1, 250 for Task 2.
- Band arithmetic follows the inherited implementation — clamp to 1–9, round to the nearest half
  with halfway values going up. Ordinary rounding is wrong here and must not be used.
- Submissions are typed or pasted text in English.
- The learner supplies the prompt when they have one; results produced without a prompt carry
  reduced certainty on the first criterion, and say so.
- Bands are estimates for practice and are labelled as such; they are not official IELTS results.
- The learner is signed in before submitting.
- Comments explain in Vietnamese because the audience is Vietnamese learners, while IELTS
  terminology stays in English so learners recognise it in official materials.

---

## 20. Dependencies

- **The Supabase platform feature** owns authentication, the tables defined in §13, the access
  rules of FR-025 and FR-026, and the retention schedule for raw model responses.
- **The evaluation workbench** (`eval/`) owns the benchmark dataset, prompt and rubric text, and
  the versioned pipeline configuration that FR-024 records and SC-002 measures against.
- **Constitution TP-1** suspended the explanation requirement during the platform migration. This
  feature produces per-criterion explanations, which meets that provision's exit condition except
  for machine-verified quotation. See the checklist for the amendment this implies.
