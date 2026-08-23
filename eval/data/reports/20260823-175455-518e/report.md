# Benchmark Report — 20260823-175455-518e

- Model: `nvidia/nemotron-3-super-120b-a12b:free` · temperature `0.3`
- Pipeline: `pipeline-v1.0` · Prompts: `v1`
- Essays: 10/10 completed · wall clock 171.9s

## Scoring quality (overall band vs gold)

| Metric | Value |
| --- | --- |
| `n` | 10 |
| `mae` | 0.5 |
| `rmse` | 0.632 |
| `bias` | -0.1 |
| `within_0.5` | 0.7 |
| `within_1.0` | 1.0 |
| `spearman_rho` | 0.908 |
| `pred_std` | 0.9 |
| `gold_std` | 1.338 |
| `std_ratio` | 0.673 |

**SC-002 (>=90% within 0.5 band): 70% — FAIL**

## By task type

| Task | n | MAE | bias | within_0.5 | rho |
| --- | --- | --- | --- | --- | --- |
| task_1 | 5 | 0.5 | -0.3 | 0.8 | 0.949 |
| task_2 | 5 | 0.5 | 0.1 | 0.6 | 0.872 |

## Per criterion

| Criterion | n | MAE | bias | within_0.5 | std_ratio |
| --- | --- | --- | --- | --- | --- |
| TASK_ACHIEVEMENT | 5 | 0.6 | -0.6 | 0.6 | 0.776 |
| TASK_RESPONSE | 5 | 0.9 | 0.5 | 0.4 | 0.625 |
| COHERENCE_COHESION | 10 | 0.75 | -0.75 | 0.5 | 0.562 |
| LEXICAL_RESOURCE | 10 | 0.7 | -0.1 | 0.6 | 0.57 |
| GRAMMATICAL_RANGE_ACCURACY | 10 | 0.75 | -0.05 | 0.5 | 0.534 |

## System quality

| Metric | Value |
| --- | --- |
| `quote_fidelity` | 0.9863 |
| `quotes_returned` | 146 |
| `empty_evidence_rate` | 0.0 |
| `failure_rate` | 0.0 |
| `llm_calls` | 40 |
| `call_mode` | per_criterion |
| `p50_latency_s` | 15.8 |
| `p95_latency_s` | 23.9 |
| `prompt_tokens_total` | 50071 |
| `completion_tokens_total` | 20053 |
| `tokens_per_essay` | 7012 |

## Per item

| Essay | Task | Gold | Pred | Error | Latency | Quote fidelity |
| --- | --- | --- | --- | --- | --- | --- |
| T1-001 | TASK_1 | 5.0 | 5.0 | +0.0 | 18.09s | 1.0 |
| T1-002 | TASK_1 | 7.0 | 6.5 | -0.5 | 23.887s | 1.0 |
| T1-003 | TASK_1 | 7.5 | 7.0 | -0.5 | 19.699s | 1.0 |
| T1-004 | TASK_1 | 8.0 | 7.0 | -1.0 | 15.848s | 1.0 |
| T1-005 | TASK_1 | 4.5 | 5.0 | +0.5 | 12.412s | 1.0 |
| T2-001 | TASK_2 | 5.5 | 6.5 | +1.0 | 23.835s | 1.0 |
| T2-002 | TASK_2 | 6.5 | 6.5 | +0.0 | 14.948s | 1.0 |
| T2-003 | TASK_2 | 7.5 | 7.5 | +0.0 | 11.852s | 0.867 |
| T2-004 | TASK_2 | 8.0 | 7.0 | -1.0 | 13.087s | 1.0 |
| T2-005 | TASK_2 | 4.5 | 5.0 | +0.5 | 18.276s | 1.0 |
