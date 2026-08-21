# Quickstart: IELTS Writing Score Assessment & Explainability

> **STALE — 2026-08-21.** Written against the retired FastAPI backend and the four-call
> criterion-by-criterion pipeline. `spec.md` was rewritten for the mock-test grader; this
> file has not been regenerated yet. Run `/speckit-plan` and `/speckit-tasks` to replace it.
> See [../README.md](../README.md).

Validates the feature end-to-end per [spec.md](./spec.md) User Story 1, against the contract in
[contracts/assessments-openapi.yaml](./contracts/assessments-openapi.yaml) and the entities in
[data-model.md](./data-model.md).

## Prerequisites

- Docker (for PostgreSQL + backend containers per `backend/Dockerfile`, `docker-compose.yml`)
- An `OPENROUTER_API_KEY` with access to the model configured in the active
  `backend/pipelines/*.yaml` (see [research.md](./research.md) decision 5)
- A learner account and bearer token already issued by the (out-of-scope) auth prerequisite —
  see plan.md's "auth dependency" note

## Setup

1. Start PostgreSQL and the backend: `docker compose up -d`
2. Apply migrations: `alembic upgrade head`
3. Load the golden dataset into `backend/data/golden/` (migrated from IE AI Evaluator per
   research.md decision 6) if not already present.

## Validation Scenario 1 — Get an explained band score (User Story 1, P1)

1. Submit a complete Task 2 essay:
   ```bash
   curl -X POST https://rexsantech.com/api/v1/assessments \
     -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
     -d '{"task_type": "TASK_2", "essay_text": "<a ≥250-word essay>"}'
   ```
2. **Expected**: HTTP 201 within 60 seconds, containing `overall_band`, exactly 4 `criteria`
   entries, and a non-empty `explanation` on every entry (per data-model.md validation rules).

## Validation Scenario 2 — Evidence-anchored explanation (User Story 2, P2)

1. Submit an essay containing one deliberately off-topic paragraph and one sentence with a clear
   grammar error.
2. **Expected**: the `TASK_RESPONSE` entry's `explanation`/`evidence_quotes` references the
   off-topic paragraph; the `GRAMMATICAL_RANGE_ACCURACY` entry quotes the erroneous sentence.

## Validation Scenario 3 — Reject below minimum word count (User Story 3, P3)

1. Submit a Task 2 essay under 250 words.
2. **Expected**: HTTP 400 with `error: BELOW_MIN_WORDS` and `minimum_words: 250`; no
   `AssessmentResult` is created (essay_submissions.status = REJECTED).

## Validation Scenario 4 — Retry after a scoring failure (User Story 3, P3)

1. Simulate an upstream LLM failure (e.g. point the pipeline config at an invalid model id) and
   submit a valid essay.
2. **Expected**: HTTP 503 with `error: SCORING_FAILED`.
3. Resubmit the same `essay_text` after restoring a valid model id.
4. **Expected**: HTTP 201 with a full result — confirming no server-side state blocks a retry.

## Golden-dataset regression check (Constitution Principle IV)

Before shipping any change to `backend/pipelines/*.yaml` or the pipeline code:

```bash
python -m src.evaluation.harness --dataset backend/data/golden --pipeline-config backend/pipelines/<config>.yaml
```

**Expected**: a `data/reports/<run_id>/{raw_results.json,metrics.json}` pair is produced;
compare `metrics.json` against the pre-change run and confirm no regression against SC-002 (≥90%
of golden essays within 0.5 band of their gold label) before merging.
