# Benchmark Report — 20260820-115528-5b16

- Model: `nvidia/nemotron-3-super-120b-a12b:free` · temperature `0.3`
- Pipeline: `pipeline-v1.0` · Prompts: `v1`
- Essays: 1/1 completed · wall clock 6.0s

## Scoring quality (overall band vs gold)

| Metric | Value |
| --- | --- |
| `n` | 1 |
| `mae` | 0.0 |
| `rmse` | 0.0 |
| `bias` | 0.0 |
| `within_0.5` | 1.0 |
| `within_1.0` | 1.0 |
| `spearman_rho` | None |
| `pred_std` | 0.0 |
| `gold_std` | 0.0 |
| `std_ratio` | None |

**SC-002 (>=90% within 0.5 band): 100% — PASS**

## By task type

| Task | n | MAE | bias | within_0.5 | rho |
| --- | --- | --- | --- | --- | --- |
| task_1 | 1 | 0.0 | 0.0 | 1.0 | None |

## Per criterion

| Criterion | n | MAE | bias | within_0.5 | std_ratio |
| --- | --- | --- | --- | --- | --- |
| TASK_ACHIEVEMENT | 1 | 0.5 | -0.5 | 1.0 | None |
| COHERENCE_COHESION | 1 | 0.0 | 0.0 | 1.0 | None |
| LEXICAL_RESOURCE | 1 | 0.5 | 0.5 | 1.0 | None |
| GRAMMATICAL_RANGE_ACCURACY | 1 | 0.5 | 0.5 | 1.0 | None |

## System quality

| Metric | Value |
| --- | --- |
| `quote_fidelity` | 1.0 |
| `quotes_returned` | 15 |
| `empty_evidence_rate` | 0.0 |
| `failure_rate` | 0.0 |
| `llm_calls` | 4 |
| `p50_latency_s` | 6.0 |
| `p95_latency_s` | 6.0 |
| `prompt_tokens_total` | 4821 |
| `completion_tokens_total` | 2146 |
| `tokens_per_essay` | 6967 |

## Per item

| Essay | Task | Gold | Pred | Error | Latency | Quote fidelity |
| --- | --- | --- | --- | --- | --- | --- |
| T1-001 | TASK_1 | 5.0 | 5.0 | +0.0 | 5.998s | 1.0 |
