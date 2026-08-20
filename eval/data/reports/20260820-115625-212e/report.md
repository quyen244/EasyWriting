# Benchmark Report — 20260820-115625-212e

- Model: `nvidia/nemotron-3-super-120b-a12b:free` · temperature `0.3`
- Pipeline: `pipeline-v1.0` · Prompts: `v1`
- Essays: 2/2 completed · wall clock 0.0s

## Scoring quality (overall band vs gold)

| Metric | Value |
| --- | --- |
| `n` | 2 |
| `mae` | 1.0 |
| `rmse` | 1.118 |
| `bias` | 0.5 |
| `within_0.5` | 0.5 |
| `within_1.0` | 0.5 |
| `spearman_rho` | None |
| `pred_std` | 0.0 |
| `gold_std` | 1.0 |
| `std_ratio` | 0.0 |

**SC-002 (>=90% within 0.5 band): 50% — FAIL**

## By task type

| Task | n | MAE | bias | within_0.5 | rho |
| --- | --- | --- | --- | --- | --- |
| task_1 | 2 | 1.0 | 0.5 | 0.5 | None |

## Per criterion

| Criterion | n | MAE | bias | within_0.5 | std_ratio |
| --- | --- | --- | --- | --- | --- |
| TASK_ACHIEVEMENT | 2 | 1.0 | 0.0 | 0.0 | 0.0 |
| COHERENCE_COHESION | 2 | 1.0 | 0.5 | 0.5 | 0.0 |
| LEXICAL_RESOURCE | 2 | 1.25 | 0.75 | 0.5 | 0.0 |
| GRAMMATICAL_RANGE_ACCURACY | 2 | 1.25 | 0.75 | 0.5 | 0.0 |

## System quality

| Metric | Value |
| --- | --- |
| `quote_fidelity` | 1.0 |
| `quotes_returned` | 8 |
| `empty_evidence_rate` | 0.0 |
| `failure_rate` | 0.0 |
| `llm_calls` | 8 |
| `p50_latency_s` | 0.0 |
| `p95_latency_s` | 0.0 |
| `prompt_tokens_total` | 800 |
| `completion_tokens_total` | 400 |
| `tokens_per_essay` | 600 |

## Per item

| Essay | Task | Gold | Pred | Error | Latency | Quote fidelity |
| --- | --- | --- | --- | --- | --- | --- |
| T1-001 | TASK_1 | 5.0 | 6.5 | +1.5 | 0.006s | 1.0 |
| T1-002 | TASK_1 | 7.0 | 6.5 | -0.5 | 0.001s | 1.0 |
