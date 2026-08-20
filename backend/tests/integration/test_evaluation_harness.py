"""Golden dataset + benchmark harness (T018, T042, T044).

Constitution Principle IV makes the harness a release gate, so the harness itself has
to be trustworthy. These run entirely offline against the fake client.
"""

from __future__ import annotations

import json

import pytest

from src.evaluation.dataset import GoldenDatasetError, load_golden_essays
from src.evaluation.harness import render_report, run_benchmark
from src.pipeline.config import load_pipeline_config
from src.schemas.assessment import CRITERIA_BY_TASK
from tests.fakes.fake_llm_client import FakeLLMClient


@pytest.fixture
def config():
    return load_pipeline_config("pipelines/v1.yaml")


@pytest.fixture
def essays():
    return load_golden_essays()


class TestGoldenDataset:
    def test_dataset_is_present_and_labelled(self, essays) -> None:
        assert len(essays) == 10
        assert all(e.gold is not None for e in essays), "an unlabelled essay is unusable"

    def test_covers_both_task_types(self, essays) -> None:
        by_task = {}
        for essay in essays:
            by_task.setdefault(essay.task_type, []).append(essay)
        assert len(by_task["TASK_1"]) == 5
        assert len(by_task["TASK_2"]) == 5

    def test_gold_criteria_match_the_task_type(self, essays) -> None:
        """A label keyed by a criterion that does not apply would never be compared
        against anything — it would silently vanish from the benchmark."""
        for essay in essays:
            assert set(essay.gold.criteria) == set(CRITERIA_BY_TASK[essay.task_type])

    def test_bands_span_a_useful_range(self, essays) -> None:
        """A dataset clustered at one band cannot distinguish a real scorer from one
        that predicts the mean."""
        overalls = [e.gold.overall for e in essays]
        assert min(overalls) <= 5.0 and max(overalls) >= 7.5

    def test_missing_dataset_fails_loudly(self, tmp_path) -> None:
        with pytest.raises(GoldenDatasetError, match="No golden essays"):
            load_golden_essays(tmp_path)

    def test_mislabelled_criteria_are_rejected(self, tmp_path) -> None:
        (tmp_path / "bad.json").write_text(
            json.dumps(
                {
                    "essay_id": "BAD-001",
                    "task_type": "TASK_2",
                    "essay_text": "word " * 300,
                    # TASK_ACHIEVEMENT belongs to Task 1, not Task 2.
                    "gold": {
                        "overall": 6.0,
                        "criteria": {"TASK_ACHIEVEMENT": 6.0},
                        "source": "test",
                    },
                }
            ),
            encoding="utf-8",
        )
        with pytest.raises(GoldenDatasetError, match="do not apply"):
            load_golden_essays(tmp_path)


class TestHarness:
    async def test_benchmarks_every_essay_and_computes_metrics(
        self, essays, config
    ) -> None:
        fake = FakeLLMClient(band=6.5, echo_real_quote=True)
        result = await run_benchmark(fake, essays, config, verbose=False)

        metrics = result["metrics"]
        assert metrics["n_completed"] == 10
        assert metrics["quality"]["overall"]["n"] == 10
        assert metrics["quality"]["task_1"]["n"] == 5
        assert metrics["quality"]["task_2"]["n"] == 5

    def test_records_the_llm_budget(self) -> None:
        """Constitution V: 4 calls per essay. The benchmark is where a regression in
        that budget would show up first and cost the most."""

        async def _run():
            essays = load_golden_essays()
            config = load_pipeline_config("pipelines/v1.yaml")
            fake = FakeLLMClient(band=6.5, echo_real_quote=True)
            result = await run_benchmark(fake, essays, config, verbose=False)
            return result["metrics"], fake

        import asyncio

        metrics, fake = asyncio.run(_run())
        assert metrics["system"]["llm_calls"] == 40
        assert len(fake.calls) == 40

    async def test_a_constant_scorer_is_visibly_bad_in_the_metrics(
        self, essays, config
    ) -> None:
        """The harness must not let 'predicts 6.5 for everything' look acceptable."""
        fake = FakeLLMClient(band=6.5, echo_real_quote=True)
        metrics = (await run_benchmark(fake, essays, config, verbose=False))["metrics"]
        overall = metrics["quality"]["overall"]

        assert overall["pred_std"] == 0.0
        assert overall["std_ratio"] == 0.0
        assert overall["spearman_rho"] is None
        assert overall["within_0.5"] < 0.9, "must not pass the SC-002 gate"

    async def test_quote_fidelity_is_measured(self, essays, config) -> None:
        genuine = FakeLLMClient(band=6.5, echo_real_quote=True)
        fabricating = FakeLLMClient(band=6.5, quote="this text is nowhere in any essay")

        good = (await run_benchmark(genuine, essays, config, verbose=False))["metrics"]
        bad = (await run_benchmark(fabricating, essays, config, verbose=False))["metrics"]

        assert good["system"]["quote_fidelity"] == 1.0
        assert bad["system"]["quote_fidelity"] == 0.0
        assert bad["system"]["empty_evidence_rate"] == 1.0

    async def test_failed_essays_are_recorded_not_fatal(self, essays, config) -> None:
        """One bad essay must not destroy a long, expensive benchmark run."""
        fake = FakeLLMClient(
            band=6.5, echo_real_quote=True, fail_nodes={"criterion:LEXICAL_RESOURCE"}
        )
        metrics = (await run_benchmark(fake, essays, config, verbose=False))["metrics"]

        assert metrics["n_completed"] == 0
        assert len(metrics["failures"]) == 10
        assert metrics["system"]["failure_rate"] == 1.0

    async def test_metrics_are_json_serialisable(self, essays, config) -> None:
        """metrics.json is the artifact runs are compared across; nan would break it."""
        fake = FakeLLMClient(band=6.5, echo_real_quote=True)
        metrics = (await run_benchmark(fake, essays, config, verbose=False))["metrics"]
        assert json.loads(json.dumps(metrics))["run_id"] == metrics["run_id"]

    async def test_report_renders_with_the_sc002_verdict(self, essays, config) -> None:
        fake = FakeLLMClient(band=6.5, echo_real_quote=True)
        metrics = (await run_benchmark(fake, essays, config, verbose=False))["metrics"]
        report = render_report(metrics)

        assert "Benchmark Report" in report
        assert "SC-002" in report
        assert "T2-005" in report
        assert config.model.id in report

    async def test_artifacts_are_written_for_comparison(
        self, essays, config, tmp_path
    ) -> None:
        """Principle IV's before/after workflow needs durable artifacts per run."""
        fake = FakeLLMClient(band=6.5, echo_real_quote=True)
        result = await run_benchmark(
            fake, essays, config, out_dir=tmp_path, verbose=False
        )
        run_dir = tmp_path / result["run_id"]

        assert (run_dir / "metrics.json").is_file()
        assert (run_dir / "raw_results.json").is_file()
        assert (run_dir / "report.md").is_file()

        raw = json.loads((run_dir / "raw_results.json").read_text(encoding="utf-8"))
        assert len(raw) == 10
        assert all(len(item["criteria"]) == 4 for item in raw)
