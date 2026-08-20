# Benchmark Report — 20260820-114948-2c66

- Model: `nvidia/nemotron-3-super-120b-a12b:free` · temperature `0.3`
- Pipeline: `pipeline-v1.0` · Prompts: `v1`
- Essays: 0/1 completed · wall clock 32.1s

## Scoring quality (overall band vs gold)

| Metric | Value |
| --- | --- |
| `n` | 0 |
| `mae` | None |
| `rmse` | None |
| `bias` | None |
| `within_0.5` | None |
| `within_1.0` | None |
| `spearman_rho` | None |
| `pred_std` | None |
| `gold_std` | None |
| `std_ratio` | None |

## By task type

| Task | n | MAE | bias | within_0.5 | rho |
| --- | --- | --- | --- | --- | --- |

## Per criterion

| Criterion | n | MAE | bias | within_0.5 | std_ratio |
| --- | --- | --- | --- | --- | --- |

## System quality

| Metric | Value |
| --- | --- |
| `quote_fidelity` | None |
| `quotes_returned` | 0 |
| `empty_evidence_rate` | None |
| `failure_rate` | 1.0 |
| `llm_calls` | 0 |
| `p50_latency_s` | 0.0 |
| `p95_latency_s` | 0.0 |
| `prompt_tokens_total` | 0 |
| `completion_tokens_total` | 0 |
| `tokens_per_essay` | 0 |

## Per item

| Essay | Task | Gold | Pred | Error | Latency | Quote fidelity |
| --- | --- | --- | --- | --- | --- | --- |

## Failures

- `T1-001`: TASK_ACHIEVEMENT: output truncated at token limit: 1 validation error for CriterionEvaluation
  Invalid JSON: expected value at line 1 column 1 [type=json_invalid, input_value='We need to output JSON w...iew(8)=128 )=129 space=', input_type=str]
    For further information visit https://errors.pydantic.dev/2.13/v/json_invalid
