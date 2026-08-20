"""Golden-dataset benchmark harness (T042, T044, Constitution Principle IV).

Runs the real scoring pipeline over the labelled golden set and reports measured
quality. Principle IV makes this a gate, not a nicety: no change to a prompt, rubric,
model, or pipeline config ships without a before/after run showing its effect.

Usage:

    # Offline smoke test — no API spend, verifies the harness itself works
    python -m src.evaluation.harness --fake

    # Real benchmark against the configured model
    python -m src.evaluation.harness --pipeline-config pipelines/v1.yaml

Writes `data/reports/<run_id>/{raw_results.json,metrics.json,report.md}`. Compare
`metrics.json` across runs; SC-002 requires >=90% of essays within 0.5 band of gold.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

from src.evaluation.dataset import (
    DEFAULT_GOLDEN_DIR,
    GoldenEssay,
    load_golden_essays,
    write_json,
)
from src.evaluation.metrics import percentile, score_block
from src.llm.base import LLMClient
from src.pipeline.config import PipelineConfig, load_pipeline_config
from src.pipeline.errors import ScoringFailedError
from src.pipeline.pipeline import PipelineOutcome, run_assessment
from src.schemas.assessment import CRITERION_NAMES

BACKEND_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_REPORTS_DIR = BACKEND_ROOT / "data" / "reports"


async def run_benchmark(
    client: LLMClient,
    essays: list[GoldenEssay],
    config: PipelineConfig,
    *,
    out_dir: Path | None = None,
    verbose: bool = True,
) -> dict:
    run_id = datetime.now().strftime("%Y%m%d-%H%M%S") + "-" + uuid.uuid4().hex[:4]
    results: list[tuple[GoldenEssay, PipelineOutcome]] = []
    failures: list[dict] = []
    started = time.perf_counter()

    for index, essay in enumerate(essays, 1):
        gold = essay.gold.overall if essay.gold else "?"
        if verbose:
            print(f"[{index}/{len(essays)}] {essay.essay_id} (gold {gold})", flush=True)
        try:
            outcome = await run_assessment(
                client,
                task_type=essay.task_type,
                essay_text=essay.essay_text,
                prompt_text=essay.prompt_text,
                config=config,
            )
            results.append((essay, outcome))
            if verbose:
                print(f"    -> {outcome.overall_band} in {outcome.latency_s}s", flush=True)
        except ScoringFailedError as exc:
            # A degraded essay is recorded and skipped rather than aborting the run:
            # partial data is still worth having, and the failure rate is itself a
            # reported metric.
            failures.append({"essay_id": essay.essay_id, "error": "; ".join(exc.failures)})
            if verbose:
                print(f"    -> FAILED: {'; '.join(exc.failures)[:120]}", flush=True)
        except Exception as exc:  # noqa: BLE001 - harness must survive any single essay
            failures.append({"essay_id": essay.essay_id, "error": f"{type(exc).__name__}: {exc}"})
            if verbose:
                print(f"    -> ERROR: {type(exc).__name__}: {exc}", flush=True)

    metrics = compute_metrics(
        results, failures, run_id, time.perf_counter() - started, config, len(essays)
    )

    if out_dir:
        base = Path(out_dir) / run_id
        write_json(
            base / "raw_results.json",
            [
                {
                    "essay_id": essay.essay_id,
                    "task_type": essay.task_type,
                    "gold": essay.gold.model_dump() if essay.gold else None,
                    "overall_band": outcome.overall_band,
                    "raw_overall": outcome.raw_overall,
                    "criteria": [
                        {
                            "criterion": c.criterion,
                            "band": c.band,
                            "raw_band": c.raw_band,
                            "length_penalty": c.applied_length_penalty,
                            "explanation": c.explanation,
                            "descriptor_reference": c.descriptor_reference,
                            "evidence_quotes": c.evidence_quotes,
                            "quotes_returned": c.quotes_returned,
                            "quotes_dropped": c.quotes_dropped,
                        }
                        for c in outcome.criteria
                    ],
                    "latency_s": outcome.latency_s,
                    "quote_fidelity": round(outcome.quote_fidelity, 3),
                }
                for essay, outcome in results
            ],
        )
        write_json(base / "metrics.json", metrics)
        (base / "report.md").write_text(render_report(metrics), encoding="utf-8")
        if verbose:
            print(f"\nWrote {base}")

    return {"run_id": run_id, "metrics": metrics, "results": results}


def compute_metrics(
    results: list[tuple[GoldenEssay, PipelineOutcome]],
    failures: list[dict],
    run_id: str,
    wall_s: float,
    config: PipelineConfig,
    n_essays: int,
) -> dict:
    overall_pred: list[float] = []
    overall_gold: list[float] = []
    per_item: list[dict] = []
    crit_pairs: dict[str, tuple[list[float], list[float]]] = {
        code: ([], []) for code in CRITERION_NAMES
    }
    latencies: list[float] = []
    quotes_returned = quotes_verified = 0
    prompt_tokens = completion_tokens = 0
    empty_evidence = criteria_total = 0

    for essay, outcome in results:
        latencies.append(outcome.latency_s)
        quotes_returned += outcome.quotes_returned
        quotes_verified += outcome.quotes_verified
        prompt_tokens += outcome.prompt_tokens
        completion_tokens += outcome.completion_tokens

        for criterion in outcome.criteria:
            criteria_total += 1
            if not criterion.evidence_quotes:
                empty_evidence += 1
            if essay.gold and criterion.criterion in essay.gold.criteria and criterion.band:
                crit_pairs[criterion.criterion][0].append(criterion.band)
                crit_pairs[criterion.criterion][1].append(
                    essay.gold.criteria[criterion.criterion]
                )

        if essay.gold:
            overall_pred.append(outcome.overall_band)
            overall_gold.append(essay.gold.overall)
            per_item.append(
                {
                    "essay_id": essay.essay_id,
                    "task_type": essay.task_type,
                    "gold": essay.gold.overall,
                    "pred": outcome.overall_band,
                    "error": round(outcome.overall_band - essay.gold.overall, 2),
                    "raw_overall": outcome.raw_overall,
                    "latency_s": outcome.latency_s,
                    "quote_fidelity": round(outcome.quote_fidelity, 3),
                }
            )

    task1 = [p for p in per_item if p["task_type"] == "TASK_1"]
    task2 = [p for p in per_item if p["task_type"] == "TASK_2"]

    return {
        "run_id": run_id,
        "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "pipeline_version": config.version,
        "prompt_version": config.prompts.version,
        "model": config.model.id,
        "temperature": config.model.temperature,
        "n_essays": n_essays,
        "n_completed": len(results),
        "failures": failures,
        "wall_clock_s": round(wall_s, 1),
        "quality": {
            "overall": score_block(overall_pred, overall_gold),
            "task_1": score_block([p["pred"] for p in task1], [p["gold"] for p in task1]),
            "task_2": score_block([p["pred"] for p in task2], [p["gold"] for p in task2]),
            "per_criterion": {
                code: score_block(pred, gold)
                for code, (pred, gold) in crit_pairs.items()
                if pred
            },
        },
        "system": {
            "quote_fidelity": round(quotes_verified / quotes_returned, 4)
            if quotes_returned
            else None,
            "quotes_returned": quotes_returned,
            "empty_evidence_rate": round(empty_evidence / criteria_total, 4)
            if criteria_total
            else None,
            "failure_rate": round(len(failures) / n_essays, 4) if n_essays else 0.0,
            "llm_calls": len(results) * 4,
            "p50_latency_s": round(percentile(latencies, 0.50), 1),
            "p95_latency_s": round(percentile(latencies, 0.95), 1),
            "prompt_tokens_total": prompt_tokens,
            "completion_tokens_total": completion_tokens,
            "tokens_per_essay": round((prompt_tokens + completion_tokens) / len(results))
            if results
            else 0,
        },
        "per_item": per_item,
    }


def render_report(m: dict) -> str:
    quality, system = m["quality"], m["system"]
    overall = quality["overall"]

    lines = [
        f"# Benchmark Report — {m['run_id']}",
        "",
        f"- Model: `{m['model']}` · temperature `{m['temperature']}`",
        f"- Pipeline: `{m['pipeline_version']}` · Prompts: `{m['prompt_version']}`",
        f"- Essays: {m['n_completed']}/{m['n_essays']} completed · "
        f"wall clock {m['wall_clock_s']}s",
        "",
        "## Scoring quality (overall band vs gold)",
        "",
        "| Metric | Value |",
        "| --- | --- |",
    ]
    for key in (
        "n", "mae", "rmse", "bias", "within_0.5", "within_1.0",
        "spearman_rho", "pred_std", "gold_std", "std_ratio",
    ):
        lines.append(f"| `{key}` | {overall.get(key)} |")

    within = overall.get("within_0.5")
    if within is not None:
        verdict = "PASS" if within >= 0.90 else "FAIL"
        lines += ["", f"**SC-002 (>=90% within 0.5 band): {within:.0%} — {verdict}**"]

    lines += ["", "## By task type", "", "| Task | n | MAE | bias | within_0.5 | rho |",
              "| --- | --- | --- | --- | --- | --- |"]
    for name in ("task_1", "task_2"):
        block = quality[name]
        if block.get("n"):
            lines.append(
                f"| {name} | {block['n']} | {block['mae']} | {block['bias']} | "
                f"{block['within_0.5']} | {block['spearman_rho']} |"
            )

    lines += ["", "## Per criterion", "",
              "| Criterion | n | MAE | bias | within_0.5 | std_ratio |",
              "| --- | --- | --- | --- | --- | --- |"]
    for code, block in quality["per_criterion"].items():
        lines.append(
            f"| {code} | {block['n']} | {block['mae']} | {block['bias']} | "
            f"{block['within_0.5']} | {block['std_ratio']} |"
        )

    lines += ["", "## System quality", "", "| Metric | Value |", "| --- | --- |"]
    lines += [f"| `{k}` | {v} |" for k, v in system.items()]

    lines += ["", "## Per item", "",
              "| Essay | Task | Gold | Pred | Error | Latency | Quote fidelity |",
              "| --- | --- | --- | --- | --- | --- | --- |"]
    for item in m["per_item"]:
        lines.append(
            f"| {item['essay_id']} | {item['task_type']} | {item['gold']} | "
            f"{item['pred']} | {item['error']:+.1f} | {item['latency_s']}s | "
            f"{item['quote_fidelity']} |"
        )

    if m["failures"]:
        lines += ["", "## Failures", ""]
        lines += [f"- `{f['essay_id']}`: {f['error']}" for f in m["failures"]]

    return "\n".join(lines) + "\n"


def _build_client(config: PipelineConfig, use_fake: bool) -> LLMClient:
    if use_fake:
        # Import here so tests/ is never a production import dependency.
        from tests.fakes.fake_llm_client import FakeLLMClient

        # echo_real_quote so the smoke run exercises the verification path properly
        # instead of reporting a uniform zero quote-fidelity.
        return FakeLLMClient(band=6.5, echo_real_quote=True)
    from src.llm.openrouter_client import OpenRouterClient

    return OpenRouterClient(
        model=config.model.id,
        temperature=config.model.temperature,
        max_tokens=config.model.max_tokens,
        reasoning=config.model.reasoning.to_payload(),
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pipeline-config", default="pipelines/v1.yaml")
    parser.add_argument("--dataset", default=str(DEFAULT_GOLDEN_DIR))
    parser.add_argument("--out-dir", default=str(DEFAULT_REPORTS_DIR))
    parser.add_argument("--task", choices=["TASK_1", "TASK_2"], default=None)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument(
        "--fake",
        action="store_true",
        help="Use the offline fake client — verifies the harness without API spend.",
    )
    args = parser.parse_args(argv)

    config = load_pipeline_config(args.pipeline_config)
    essays = load_golden_essays(Path(args.dataset), task_filter=args.task, limit=args.limit)

    print(
        f"Benchmarking {len(essays)} essays · model={config.model.id} "
        f"· prompts={config.prompts.version}" + (" · FAKE CLIENT" if args.fake else "")
    )
    outcome = asyncio.run(
        run_benchmark(
            _build_client(config, args.fake), essays, config, out_dir=Path(args.out_dir)
        )
    )

    overall = outcome["metrics"]["quality"]["overall"]
    if overall.get("n"):
        print(
            f"\nMAE {overall['mae']} · within_0.5 {overall['within_0.5']:.0%} "
            f"· rho {overall['spearman_rho']} · std_ratio {overall['std_ratio']}"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
