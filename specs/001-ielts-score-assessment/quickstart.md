# Quickstart: Validating the WriteWise Grader

Validation guide for [spec.md](./spec.md)'s acceptance scenarios. Schema is in
[data-model.md](./data-model.md), the wire contract in
[contracts/grade-task-openapi.yaml](./contracts/grade-task-openapi.yaml). This is a run guide, not
an implementation — code bodies belong to `/speckit-tasks` and the implementation phase.

## Prerequisites

- Supabase CLI, logged in and linked to the project (`supabase link`).
- Deno installed locally (for running Edge Function tests before deploying).
- An `OPENROUTER_API_KEY` set as a Supabase Edge Function secret:
  `supabase secrets set OPENROUTER_API_KEY=...`
- Python + the `eval/` environment already set up (`eval/requirements.txt`) for the golden-set
  hypothesis test in step 5.

## Setup

1. **Copy the canonical prompt into the function bundle** (research.md R3 — manual on purpose):

   ```bash
   cp -r eval/prompts/v2/ supabase/functions/grade-task/prompts/
   ```

2. **Apply the migration** (creates `grader_results`, `llm_calls`, RLS policies, column revokes,
   the partial unique index, and the completeness check constraint from data-model.md):

   ```bash
   supabase db push
   ```

3. **Deploy the function**:

   ```bash
   supabase functions deploy grade-task
   ```

## Validating each user story

### User Story 1 — Grade one piece of writing

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/grade-task" \
  -H "Authorization: Bearer <a real learner session JWT>" \
  -H "Content-Type: application/json" \
  -d '{
        "task_type": "TASK_2",
        "prompt_text": "Some people think university students should study whatever they want...",
        "essay_text": "<at least 250 words of English writing>"
      }'
```

**Expected**: HTTP 200, body matching `GraderResult` in the contract — four `criteria` entries in
the fixed order (position 1 labelled "Task Response" for `TASK_2`), an `overall_band` equal to the
mean of the four criterion bands rounded to the nearest half, and `provisional: true`.

**Also check** (scenario 2): repeat with `task_type: "TASK_1"` and confirm position 1's `label` is
"Task Achievement" instead.

**Also check** (scenario 4): confirm `overall_band` in the response equals
`round_half_up(mean(criteria[*].band))` computed independently from the same response — this
verifies AD-1/FR-004 without trusting the function's own arithmetic.

### User Story 2 — Understand why the band was given

Inspect `criteria[*].comment` in the response above.

**Expected**: each comment is non-empty, written in Vietnamese, and names specific characteristics
of the submitted essay (not generic praise) — while criterion names and any quoted descriptor
language remain in English (FR-015).

**Length penalty visibility** (scenario 3): submit an essay under the task's minimum by more than
40%:

```bash
curl ... -d '{"task_type": "TASK_2", "essay_text": "<under 150 words>"}'
```

**Expected**: `length_penalty: 1.0` in the response, and — by inspecting the corresponding
`grader_results` row directly — the first criterion's `band` is exactly 1.0 lower than it would be
without the deduction (verifiable by comparing against the raw model output recorded in the
matching `llm_calls.raw_response`).

### User Story 3 — Revisit past submissions

As the same learner, via `supabase-js` (not this function):

```ts
const { data } = await supabase
  .from("grader_results")
  .select("*")
  .order("created_at", { ascending: false });
```

**Expected**: every prior submission appears, each with the same `overall_band` and `criteria` it
was first given (FR-023).

**Ownership check** (scenario 3): as a *different* learner, attempt to `select` a specific
`grader_result_id` known to belong to the first learner.

**Expected**: zero rows returned — this is the behavior the pgTAP test in research.md R5 must
assert directly against the policy, not just observe once here.

### User Story 4 — Recover from a failed grading

Force a failure by pointing the function at an invalid model id (a test-only override), or by
submitting while `OPENROUTER_API_KEY` is temporarily unset in a staging function.

**Expected**: HTTP 500, body matching `GraderFailure`, `status: "failed"`. Querying
`grader_results` directly shows the row with `status = 'failed'` and the original `essay_text`
intact. Re-submitting the same essay text succeeds normally (a new row, not a resurrection of the
failed one — see data-model.md's State Transitions).

**Duplicate-submission check** (Edge Cases): fire the same request twice in quick succession.

**Expected**: the second request receives `429` with `error_code: "SUBMISSION_ALREADY_ACTIVE"` —
verifying research.md R4's partial unique index actually rejects the second insert rather than
silently creating two rows.

## Validating the Principle IV hypothesis test (research.md R2)

Before `pipeline-v2.0` (this feature's single-call design) is treated as ready to replace
`pipeline-v1.0` as production's methodology of record:

```bash
cd eval
python -m src.evaluation.harness --pipeline-config pipelines/v1.yaml   # existing four-call baseline
python -m src.evaluation.harness --pipeline-config pipelines/v2.yaml   # this feature's one-call design
```

**Expected**: two `metrics.json` artifacts under `eval/data/reports/`. Compare them against the
same golden set (`eval/data/golden/`) — SC-002 ("at least 90% of overall bands fall within 0.5 of an
independent human rater's band") must hold for `v2` before it is what `grade-task` deploys with.

## Validating RLS and column grants directly (Principle III)

```bash
supabase test db
```

**Expected**: pgTAP assertions (research.md R5) pass, proving — against the real policies, not a
reimplementation of them — that a learner can read their own `grader_results` rows, cannot read
another learner's, and cannot `UPDATE overall_band`, `criteria`, `status`, or the other revoked
columns on a row they own.
