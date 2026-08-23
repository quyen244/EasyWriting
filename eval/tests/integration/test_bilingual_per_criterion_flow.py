"""End-to-end pipeline-v3.0 scoring — v1's four concurrent calls, bilingual output.

pipeline-v3.0 is what production will actually run, chosen over v2 after Phase A
measured v2 as slower and more token-hungry (specs/00-grading-feature/phase-a-findings.md).
Because `run_assessment_v3` is a thin wrapper over `run_assessment`, the risk this file
guards is narrow but real: that adding the bilingual schema quietly changed something
v1 already got right — the call count, the concurrency, the length-penalty placement,
or the refusal to return a partial result.
"""

from __future__ import annotations

import time

import pytest

from src.pipeline.config import load_pipeline_config
from src.pipeline.errors import ScoringFailedError
from src.pipeline.pipeline import run_assessment, run_assessment_v3
from tests.conftest import FABRICATED_QUOTE, REAL_QUOTE, TASK_2_ESSAY
from tests.fakes.fake_llm_client import FakeLLMClient
from tests.unit.test_combined_evaluation import TASK_1_ESSAY


@pytest.fixture
def config():
    return load_pipeline_config("pipelines/v3.yaml")


class TestConfig:
    def test_declares_the_bilingual_per_criterion_call_mode(self, config) -> None:
        assert config.call_mode == "per_criterion_bilingual"
        assert config.prompts.version == "v3"
        assert config.version == "pipeline-v3.0"

    def test_reasoning_stays_off(self, config) -> None:
        """Non-negotiable on this model: reasoning tokens are billed output tokens
        charged against max_tokens, and turning them on truncated every response
        mid-JSON when it was last measured (see v1.yaml's comment)."""
        assert config.model.reasoning.enabled is False

    def test_only_prompts_and_budget_differ_from_v1(self, config) -> None:
        """Principle IV: an accuracy delta against the v1 benchmark is only
        attributable to the prompt change if nothing else moved."""
        v1 = load_pipeline_config("pipelines/v1.yaml")
        assert config.model.id == v1.model.id
        assert config.model.temperature == v1.model.temperature
        assert config.model.seed == v1.model.seed
        assert config.scoring.length_penalty == v1.scoring.length_penalty


class TestPipelineOrchestration:
    async def test_makes_four_calls_one_per_criterion(self, config) -> None:
        fake = FakeLLMClient(band=6.5, quote=REAL_QUOTE)
        outcome = await run_assessment_v3(
            fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
        )

        assert sorted(fake.calls) == sorted(
            [
                "criterion:TASK_RESPONSE",
                "criterion:COHERENCE_COHESION",
                "criterion:LEXICAL_RESOURCE",
                "criterion:GRAMMATICAL_RANGE_ACCURACY",
            ]
        )
        assert outcome.overall_band == 6.5
        assert outcome.partial is False

    async def test_calls_run_concurrently_not_sequentially(self, config) -> None:
        """The explicit requirement for this pipeline: batch the four calls, do not
        issue them one after another. With a 0.2s-per-call fake, sequential would take
        ~0.8s and concurrent ~0.2s, so the 0.5s bound cannot be met by accident."""
        fake = FakeLLMClient(band=6.0, quote=REAL_QUOTE, delay_s=0.2)
        started = time.perf_counter()
        await run_assessment_v3(
            fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
        )
        assert time.perf_counter() - started < 0.5

    async def test_returns_four_criteria_in_fixed_order(self, config) -> None:
        fake = FakeLLMClient(band=6.0, quote=REAL_QUOTE)
        outcome = await run_assessment_v3(
            fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
        )
        assert [c.criterion for c in outcome.criteria] == [
            "TASK_RESPONSE",
            "COHERENCE_COHESION",
            "LEXICAL_RESOURCE",
            "GRAMMATICAL_RANGE_ACCURACY",
        ]

    async def test_task1_leads_with_task_achievement(self, config) -> None:
        fake = FakeLLMClient(band=6.0, quote="bar chart")
        outcome = await run_assessment_v3(
            fake, task_type="TASK_1", essay_text=TASK_1_ESSAY, config=config
        )
        assert outcome.criteria[0].criterion == "TASK_ACHIEVEMENT"

    async def test_records_v3_provenance(self, config) -> None:
        fake = FakeLLMClient(band=6.0, quote=REAL_QUOTE)
        outcome = await run_assessment_v3(
            fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
        )
        assert outcome.pipeline_version == "pipeline-v3.0"
        assert outcome.prompt_version == "v3"


class TestBilingualFields:
    async def test_all_four_bilingual_fields_reach_the_outcome(self, config) -> None:
        """`public.writing_attempts`' `criteria_match_task()` constraint rejects an
        insert whose `comment.en` or `comment.vi` is empty, so an empty string here is
        not cosmetic — it is a row the database will refuse."""
        fake = FakeLLMClient(band=6.0, quote=REAL_QUOTE)
        outcome = await run_assessment_v3(
            fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
        )
        for c in outcome.criteria:
            assert c.comment_en and c.comment_vi
            assert c.improvement_en and c.improvement_vi

    async def test_plain_v1_leaves_them_empty(self) -> None:
        """The bilingual fields are opt-in, not a shape change forced on v1. v1 must
        keep producing exactly what its committed benchmark was produced from."""
        v1 = load_pipeline_config("pipelines/v1.yaml")
        fake = FakeLLMClient(band=6.0, quote=REAL_QUOTE)
        outcome = await run_assessment(
            fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=v1
        )
        assert all(c.comment_en == "" and c.improvement_vi == "" for c in outcome.criteria)


class TestInheritedV1Behaviour:
    """These properties belong to `run_assessment`, which v3 delegates to. They are
    re-asserted through the v3 entry point because delegation is exactly the thing a
    future refactor could break without any v1 test noticing."""

    async def test_fabricated_quotes_are_dropped_but_band_survives(self, config) -> None:
        fake = FakeLLMClient(band=7.0, quote=FABRICATED_QUOTE)
        outcome = await run_assessment_v3(
            fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
        )
        for c in outcome.criteria:
            assert c.evidence_quotes == []
            assert c.quotes_dropped == 1
            assert c.band == 7.0
        assert outcome.quote_fidelity == 0.0

    async def test_one_failed_criterion_fails_the_whole_assessment(self, config) -> None:
        """No partial result is ever shippable — Constitution I forbids a band without
        its explanation, and the stored `criteria` column requires all four."""
        fake = FakeLLMClient(
            band=6.0, quote=REAL_QUOTE, fail_nodes={"criterion:LEXICAL_RESOURCE"}
        )
        with pytest.raises(ScoringFailedError):
            await run_assessment_v3(
                fake, task_type="TASK_2", essay_text=TASK_2_ESSAY, config=config
            )

    async def test_length_penalty_hits_the_task_criterion_only(self, config) -> None:
        """A short essay must not be punished four times over for one shortcoming."""
        short = "Social media is bad. It wastes time. People should read books instead."
        fake = FakeLLMClient(band=6.0, quote="Social media is bad", echo_real_quote=True)
        outcome = await run_assessment_v3(
            fake, task_type="TASK_2", essay_text=short, config=config
        )

        penalised = [c for c in outcome.criteria if c.applied_length_penalty > 0]
        assert [c.criterion for c in penalised] == ["TASK_RESPONSE"]
