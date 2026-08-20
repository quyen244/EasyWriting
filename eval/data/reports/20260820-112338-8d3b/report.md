# Benchmark Report — 20260820-112338-8d3b

- Model: `nvidia/nemotron-3-super-120b-a12b:free` · temperature `0.3`
- Pipeline: `pipeline-v1.0` · Prompts: `v1`
- Essays: 10/10 completed · wall clock 0.0s

## Scoring quality (overall band vs gold)

| Metric | Value |
| --- | --- |
| `n` | 10 |
| `mae` | 1.2 |
| `rmse` | 1.342 |
| `bias` | 0.1 |
| `within_0.5` | 0.2 |
| `within_1.0` | 0.5 |
| `spearman_rho` | None |
| `pred_std` | 0.0 |
| `gold_std` | 1.338 |
| `std_ratio` | 0.0 |

**SC-002 (>=90% within 0.5 band): 20% — FAIL**

## By task type

| Task | n | MAE | bias | within_0.5 | rho |
| --- | --- | --- | --- | --- | --- |
| task_1 | 5 | 1.3 | 0.1 | 0.2 | None |
| task_2 | 5 | 1.1 | 0.1 | 0.2 | None |

## Per criterion

| Criterion | n | MAE | bias | within_0.5 | std_ratio |
| --- | --- | --- | --- | --- | --- |
| TASK_ACHIEVEMENT | 5 | 1.3 | -0.3 | 0.0 | 0.139 |
| TASK_RESPONSE | 5 | 1.0 | 0.0 | 0.2 | 0.156 |
| COHERENCE_COHESION | 10 | 1.15 | -0.15 | 0.3 | 0.0 |
| LEXICAL_RESOURCE | 10 | 1.4 | 0.1 | 0.2 | 0.0 |
| GRAMMATICAL_RANGE_ACCURACY | 10 | 1.4 | 0.3 | 0.2 | 0.0 |

## System quality

| Metric | Value |
| --- | --- |
| `quote_fidelity` | 1.0 |
| `quotes_returned` | 40 |
| `empty_evidence_rate` | 0.0 |
| `failure_rate` | 0.0 |
| `llm_calls` | 40 |
| `p50_latency_s` | 0.0 |
| `p95_latency_s` | 0.0 |
| `prompt_tokens_total` | 4000 |
| `completion_tokens_total` | 2000 |
| `tokens_per_essay` | 600 |

## Per item

| Essay | Task | Gold | Pred | Error | Latency | Quote fidelity |
| --- | --- | --- | --- | --- | --- | --- |
| T1-001 | TASK_1 | 5.0 | 6.5 | +1.5 | 0.006s | 1.0 |
| T1-002 | TASK_1 | 7.0 | 6.5 | -0.5 | 0.001s | 1.0 |
| T1-003 | TASK_1 | 7.5 | 6.5 | -1.0 | 0.001s | 1.0 |
| T1-004 | TASK_1 | 8.0 | 6.5 | -1.5 | 0.001s | 1.0 |
| T1-005 | TASK_1 | 4.5 | 6.5 | +2.0 | 0.001s | 1.0 |
| T2-001 | TASK_2 | 5.5 | 6.5 | +1.0 | 0.002s | 1.0 |
| T2-002 | TASK_2 | 6.5 | 6.5 | +0.0 | 0.002s | 1.0 |
| T2-003 | TASK_2 | 7.5 | 6.5 | -1.0 | 0.002s | 1.0 |
| T2-004 | TASK_2 | 8.0 | 6.5 | -1.5 | 0.002s | 1.0 |
| T2-005 | TASK_2 | 4.5 | 6.5 | +2.0 | 0.001s | 1.0 |
