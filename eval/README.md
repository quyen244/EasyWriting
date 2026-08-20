# `eval/` — scoring evaluation workbench

**This package serves no user traffic.** It is the offline workbench that Constitution
Principle IV requires: no scoring-methodology change ships until it has been run against the
golden dataset and compared before/after.

It was extracted from the retired `backend/` service in constitution v3.0.0. The FastAPI app,
SQLAlchemy models, Alembic migrations, auth, and Docker deployment were deleted — Supabase
provides authentication and the database now, and authorization is enforced by Postgres RLS.
What remains here is the scoring logic and the evidence that it works.

## Layout

| Path | What it is |
|---|---|
| `data/golden/` | The labelled dataset — 5 Task 1 + 5 Task 2 essays with rater bands |
| `data/reports/` | Benchmark artifacts, one directory per run (`metrics.json`, `raw_results.json`, `report.md`) |
| `pipelines/*.yaml` | Versioned pipeline configuration — model, params, prompt version. **The single source of truth for how an essay is scored.** |
| `prompts/<version>/` | Criterion prompt templates and the IELTS band-descriptor rubrics |
| `src/pipeline/` | Orchestration, preprocessing, quote verification, aggregation, length rule |
| `src/llm/` | Model-agnostic client interface + the OpenRouter adapter (Constitution V) |
| `src/evaluation/` | Dataset loader, benchmark harness, metrics |
| `src/schemas/assessment.py` | Scoring shapes shared by the pipeline and the harness |

## Running it

```bash
pip install -r requirements.txt

pytest -q                                     # offline suite; injects FakeLLMClient, zero API spend
python -m src.evaluation.harness --fake --limit 2   # smoke-test the harness without calling a model
```

To benchmark against a live model, set `OPENROUTER_API_KEY` in `.env` (see `.env.example`) and
drop `--fake`. This spends real credit.

## Changing scoring methodology

Per Principle IV, never edit Python to change *how* essays are scored — edit the config, and
prove the change on data:

1. `cp -r prompts/v1 prompts/v2` — if the prompt or rubric text is changing
2. `cp pipelines/v1.yaml pipelines/v2.yaml` and edit it
3. `python -m src.evaluation.harness --pipeline-config pipelines/v2.yaml`
4. Compare the new `metrics.json` against the v1 run before adopting

Every stored score records its `pipeline_version` and `model_id`, so any score in production
can be traced back to the methodology that produced it.

## Relationship to production

Production scoring runs in a Supabase Edge Function, not here. This package is where its
prompts, rubrics, and aggregation rules are validated before they are deployed there, and it
is the starting point for the Tier 2 Python worker described in the constitution's Technology
& Architecture Constraints — the one that will eventually generate the per-criterion
explanations currently deferred under TP-1.

Growing the dataset is part of the job: Principle IV requires that real production submissions
flagged as low-confidence, failed, or anomalous become candidate additions to `data/golden/`.
Ten samples cannot carry a methodology decision on their own.
