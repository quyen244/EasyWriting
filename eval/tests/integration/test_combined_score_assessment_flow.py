"""End-to-end pipeline-v2.0 scoring through the real orchestrator with a fake LLM.

Mirrors test_score_assessment_flow.py's v1 coverage, but the property that matters
most here is the one v1 never had to prove: exactly ONE call produces all four
criteria. That is what this feature exists to change (specs/00-grading-feature).
"""

from __future__ import annotations

import pytest

from src.pipeline.config import load_pipeline_config
from src.pipeline.errors import ScoringFailedError
from src.pipeline.pipeline import run_assessment_v2
from tests.conftest import FABRICATED_QUOTE, REAL_QUOTE, TASK_2_ESSAY
from tests.fakes.fake_llm_client import FakeLLMClient
from tests.unit.test_combined_evaluation import TASK_1_ESSAY


@pytest.fixture
def config():
    return load_pipeline_config("pipelines/v2.yaml")


class TestPipelineOrchestration:
    async def test_makes_exactly_one_call(self, config) -> None:
        """The entire point of this feature. A regression here means v2 quietly went
        back to costing what v1 costs — the harness's `llm_calls` metric would also
        catch this, but that only shows up after spending real API calls to find out."""
        fake = FakeLLMClient(band=6.5, quote=REAL_QUOTE)
        outcome = await run_assessment_v2(
            fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
        )

        assert fake.calls == ["combined"]
        assert len(outcome.criteria) == 4
        assert outcome.overall_band == 6.5
        assert outcome.partial is False

    async def test_returns_four_criteria_in_fixed_order(self, config) -> None:
        fake = FakeLLMClient(band=6.0, quote=REAL_QUOTE)
        outcome = await run_assessment_v2(
            fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
        )
        assert [c.criterion for c in outcome.criteria] == [
            "TASK_RESPONSE", "COHERENCE_COHESION", "LEXICAL_RESOURCE",
            "GRAMMATICAL_RANGE_ACCURACY",
        ]

    async def test_task1_leads_with_task_achievement(self, config) -> None:
        fake = FakeLLMClient(band=6.0, quote="bar chart")
        outcome = await run_assessment_v2(
            fake, task_type="TASK_1", essay_text=TASK_1_ESSAY, config=config
        )
        assert outcome.criteria[0].criterion == "TASK_ACHIEVEMENT"

    async def test_bilingual_fields_reach_the_outcome(self, config) -> None:
        """v1's CriterionOutcome never populates these — this is what proves the new
        fields actually flow from the model response through to the stored outcome."""
        fake = FakeLLMClient(band=6.0, quote=REAL_QUOTE)
        outcome = await run_assessment_v2(
            fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
        )
        for c in outcome.criteria:
            assert c.comment_en and c.comment_vi
            assert c.improvement_en and c.improvement_vi

    async def test_mixed_criterion_bands_aggregate_correctly(self, config) -> None:
        fake = FakeLLMClient(
            band=6.0,
            quote=REAL_QUOTE,
            bands_by_criterion={
                "TASK_RESPONSE": 7.0,
                "COHERENCE_COHESION": 6.5,
                "LEXICAL_RESOURCE": 6.0,
                "GRAMMATICAL_RANGE_ACCURACY": 5.5,
            },
        )
        outcome = await run_assessment_v2(
            fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
        )
        # mean(7.0, 6.5, 6.0, 5.5) = 6.25 -> nearest half, .25 rounds up per round_to_half
        assert outcome.overall_band == 6.5

    async def test_length_penalty_still_applies_to_the_task_criterion_only(self, config) -> None:
        short_essay = "This is much too short for the two hundred and fifty word minimum."
        fake = FakeLLMClient(band=7.0, quote="short")
        outcome = await run_assessment_v2(
            fake, task_type="TASK_2", essay_text=short_essay, config=config
        )
        by_code = {c.criterion: c for c in outcome.criteria}
        assert by_code["TASK_RESPONSE"].applied_length_penalty > 0
        assert by_code["TASK_RESPONSE"].band < by_code["TASK_RESPONSE"].raw_band
        assert by_code["LEXICAL_RESOURCE"].applied_length_penalty == 0
        assert by_code["LEXICAL_RESOURCE"].band == by_code["LEXICAL_RESOURCE"].raw_band

    async def test_genuine_quotes_survive_verification(self, config) -> None:
        fake = FakeLLMClient(band=6.5, quote=REAL_QUOTE)
        outcome = await run_assessment_v2(
            fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
        )
        assert all(REAL_QUOTE in c.evidence_quotes for c in outcome.criteria)

    async def test_fabricated_quotes_are_dropped_but_the_band_survives(self, config) -> None:
        fake = FakeLLMClient(band=6.5, quote=FABRICATED_QUOTE)
        outcome = await run_assessment_v2(
            fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
        )
        for c in outcome.criteria:
            assert c.evidence_quotes == []
            assert c.quotes_dropped == 1
            assert c.band == 6.5  # the band came from the rubric, not the quote

    async def test_a_failed_call_raises_rather_than_returning_a_partial_score(
        self, config
    ) -> None:
        """Unlike v1, there is no per-criterion degradation possible with one call —
        the whole assessment either lands or it fails. That is a documented, not an
        accidental, difference (pipeline.py's run_assessment_v2 docstring)."""
        fake = FakeLLMClient(band=6.0, fail_nodes={"combined"})
        with pytest.raises(ScoringFailedError):
            await run_assessment_v2(
                fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
            )
