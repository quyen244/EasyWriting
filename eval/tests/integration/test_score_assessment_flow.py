"""End-to-end scoring flow through the real pipeline with a fake LLM (T022).

Exercises orchestration, concurrency, the length rule, degradation and persistence
without a network call, so a broken pipeline surfaces in milliseconds rather than at
the end of a paid benchmark run.
"""

from __future__ import annotations

import time

import pytest

from src.pipeline.config import load_pipeline_config
from src.pipeline.errors import ScoringFailedError
from src.pipeline.pipeline import run_assessment
from tests.conftest import FABRICATED_QUOTE, REAL_QUOTE, TASK_2_ESSAY
from tests.fakes.fake_llm_client import FakeLLMClient


@pytest.fixture
def config():
    return load_pipeline_config("pipelines/v1.yaml")


class TestPipelineOrchestration:
    async def test_scores_all_four_criteria_in_exactly_four_calls(self, config) -> None:
        """Constitution V caps this feature at 4 LLM calls per assessment — down from
        the reference pipeline's 6. A regression here is a direct budget regression."""
        fake = FakeLLMClient(band=6.5, quote=REAL_QUOTE)
        outcome = await run_assessment(
            fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
        )

        assert len(fake.calls) == 4
        assert len(outcome.criteria) == 4
        assert outcome.overall_band == 6.5
        assert outcome.partial is False

    async def test_the_four_calls_run_concurrently_not_sequentially(self, config) -> None:
        """research.md decision 9: concurrency is what keeps this inside SC-001's
        60s budget. Four 0.3s calls must take ~0.3s wall-clock, not ~1.2s."""
        fake = FakeLLMClient(band=6.0, quote=REAL_QUOTE, delay_s=0.3)

        started = time.perf_counter()
        await run_assessment(
            fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
        )
        elapsed = time.perf_counter() - started

        assert elapsed < 0.9, f"took {elapsed:.2f}s — calls appear to be sequential"

    async def test_task_1_selects_the_task_achievement_rubric(self, config) -> None:
        fake = FakeLLMClient(band=7.0, quote=REAL_QUOTE)
        outcome = await run_assessment(
            fake, task_type="TASK_1", essay_text=TASK_2_ESSAY, config=config
        )
        codes = {c.criterion for c in outcome.criteria}
        assert "TASK_ACHIEVEMENT" in codes and "TASK_RESPONSE" not in codes

    async def test_records_which_methodology_produced_the_result(self, config) -> None:
        """Constitution IV provenance: a stored score must be traceable to its config."""
        fake = FakeLLMClient(band=6.0, quote=REAL_QUOTE)
        outcome = await run_assessment(
            fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
        )
        assert outcome.pipeline_version == "pipeline-v1.0"
        assert outcome.prompt_version == "v1"
        assert outcome.model_used == config.model.id


class TestAggregationAndLengthRule:
    async def test_mixed_criterion_bands_aggregate_correctly(self, config) -> None:
        fake = FakeLLMClient(
            quote=REAL_QUOTE,
            bands_by_criterion={
                "TASK_RESPONSE": 7.0,
                "COHERENCE_COHESION": 6.0,
                "LEXICAL_RESOURCE": 6.0,
                "GRAMMATICAL_RANGE_ACCURACY": 6.5,
            },
        )
        outcome = await run_assessment(
            fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
        )
        assert outcome.raw_overall == 6.375
        assert outcome.overall_band == 6.5

    async def test_under_length_penalises_only_the_task_criterion(self, config) -> None:
        """The prompt tells the model not to deduct for length, and the code applies
        the deduction to TR/TA only. Both halves must hold or the learner is penalised
        twice — or not at all."""
        # 150 words against a 250 minimum -> 40% deficit -> moderate 0.5 penalty.
        short_essay = (
            "Education should be free for all citizens because it increases social "
            "mobility and benefits the wider economy over the long term. "
        ) * 8
        fake = FakeLLMClient(band=6.0, quote="Education should be free")

        outcome = await run_assessment(
            fake, task_type="TASK_2", essay_text=short_essay, config=config
        )
        by_code = {c.criterion: c for c in outcome.criteria}

        assert by_code["TASK_RESPONSE"].band == 5.5
        assert by_code["TASK_RESPONSE"].raw_band == 6.0
        assert by_code["TASK_RESPONSE"].applied_length_penalty == 0.5
        for code in ("COHERENCE_COHESION", "LEXICAL_RESOURCE", "GRAMMATICAL_RANGE_ACCURACY"):
            assert by_code[code].band == 6.0, f"{code} must not be penalised for length"


class TestQuoteVerification:
    async def test_genuine_quotes_survive_verification(self, config) -> None:
        fake = FakeLLMClient(band=6.0, quote=REAL_QUOTE)
        outcome = await run_assessment(
            fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
        )
        assert outcome.quote_fidelity == 1.0
        assert all(c.evidence_quotes for c in outcome.criteria)

    async def test_fabricated_quotes_are_dropped_not_returned(self, config) -> None:
        """SC-003: the credibility claim is that quotes come from the learner's own
        essay. A model that invents one must not have it surface to the learner."""
        fake = FakeLLMClient(band=6.0, quote=FABRICATED_QUOTE)
        outcome = await run_assessment(
            fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
        )

        assert outcome.quote_fidelity == 0.0
        for criterion in outcome.criteria:
            assert criterion.evidence_quotes == []
            assert criterion.quotes_dropped == 1
            # Band and explanation survive: they came from the rubric-grounded
            # justification, not from the fabricated quote.
            assert criterion.band == 6.0
            assert criterion.explanation


class TestDegradation:
    async def test_a_failed_criterion_raises_rather_than_returning_a_partial_score(
        self, config
    ) -> None:
        """FR-012 forbids a band without an explanation, and the contract requires
        exactly 4 criteria — so a 3-of-4 run is a failure, not a result."""
        fake = FakeLLMClient(band=6.0, quote=REAL_QUOTE, fail_nodes={"criterion:LEXICAL_RESOURCE"})

        with pytest.raises(ScoringFailedError) as exc_info:
            await run_assessment(
                fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
            )

        assert any("LEXICAL_RESOURCE" in f for f in exc_info.value.failures)

    async def test_the_other_three_criteria_are_still_attempted(self, config) -> None:
        """Degradation is graceful: one failure must not cancel the sibling calls."""
        fake = FakeLLMClient(band=6.0, quote=REAL_QUOTE, fail_nodes={"criterion:LEXICAL_RESOURCE"})

        with pytest.raises(ScoringFailedError):
            await run_assessment(
                fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
            )

        assert len(fake.calls) == 4, "all four calls should still have been issued"
