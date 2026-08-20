"""User Story 2 — evidence anchored in the learner's own text (T036).

The product claim is that an explanation points at *your* sentences, not at generic
advice. That claim has two testable halves:

  1. a quote attached to a criterion surfaces under THAT criterion, so a learner
     reading four explanations side by side cannot confuse them (FR-011); and
  2. anything the model did not actually copy from the essay never reaches the learner.

Only (2) can be enforced by code. (1) depends on the model attributing sensibly, so
what is tested here is that the plumbing preserves attribution faithfully — a quote
returned for GRAMMATICAL_RANGE_ACCURACY must not leak into LEXICAL_RESOURCE.
"""

from __future__ import annotations

import pytest

from src.pipeline.config import load_pipeline_config
from src.pipeline.pipeline import run_assessment
from src.pipeline.verify import drop_unverified_quotes, normalize, quote_in_essay
from tests.fakes.fake_llm_client import FakeLLMClient

# An essay with two deliberately distinct defects: an off-topic paragraph (a Task
# Response problem) and a sentence with clear grammar errors (a GRA problem).
# Deliberately over the 250-word Task 2 minimum, so that submitting it through the API
# exercises the scoring path rather than being turned away by the word-count gate.
ESSAY_WITH_PLANTED_DEFECTS = """\
Some people believe that governments should invest more heavily in public transport
rather than building new roads. I agree with this position, because public transport
reduces congestion and lowers emissions across a city as a whole, and because the
benefits are distributed more fairly across the population than road spending is.

The first advantage is efficiency. A single bus can carry as many passengers as forty
private cars, which frees road space and shortens journey times for everyone who still
needs to drive. Cities that have invested in rail networks report measurable falls in
average commuting time, and those gains persist because rail capacity can be increased
without acquiring further land. Road building, by contrast, tends to generate the very
demand it was intended to absorb, so congestion returns within a few years.

The second advantage concerns fairness. Not every household can afford to run a car,
and a transport policy built around private vehicles quietly excludes those who cannot.
Students, elderly residents and low-income workers depend on buses and trains to reach
education and employment. Investment in these services therefore widens opportunity in
a way that another motorway lane simply does not.

My favourite food is pizza and I also enjoy playing football at the weekend with my
cousins. Last summer we travelled to the coast and the weather was very pleasant.

The government have not never considered how much this problems is affecting to the
citizens who is living in the suburb areas, where the bus services is very rare.

In conclusion, investment in public transport delivers benefits that road building
cannot match, both in reducing congestion and in extending opportunity to people who
would otherwise be left behind. Governments should prioritise it accordingly.
"""

OFF_TOPIC_QUOTE = "My favourite food is pizza and I also enjoy playing football"
GRAMMAR_ERROR_QUOTE = "The government have not never considered how much this problems is"


@pytest.fixture
def config():
    return load_pipeline_config("pipelines/v1.yaml")


class TestQuoteAttribution:
    async def test_each_criterions_quote_surfaces_under_that_criterion(
        self, config
    ) -> None:
        """FR-011: explanations must be unambiguously labelled, and their evidence
        must travel with the right one."""
        fake = FakeLLMClient(
            bands_by_criterion={"TASK_RESPONSE": 5.0, "GRAMMATICAL_RANGE_ACCURACY": 4.5},
            band=6.5,
            quotes_by_criterion={
                "TASK_RESPONSE": [OFF_TOPIC_QUOTE],
                "GRAMMATICAL_RANGE_ACCURACY": [GRAMMAR_ERROR_QUOTE],
                "COHERENCE_COHESION": ["The first advantage is efficiency"],
                "LEXICAL_RESOURCE": ["reduces congestion and lowers emissions"],
            },
        )

        outcome = await run_assessment(
            fake,
            task_type="TASK_2",
            essay_text=ESSAY_WITH_PLANTED_DEFECTS,
            config=config,
        )
        by_code = {c.criterion: c for c in outcome.criteria}

        assert OFF_TOPIC_QUOTE in by_code["TASK_RESPONSE"].evidence_quotes
        assert GRAMMAR_ERROR_QUOTE in by_code["GRAMMATICAL_RANGE_ACCURACY"].evidence_quotes

        # No cross-contamination between criteria.
        assert OFF_TOPIC_QUOTE not in by_code["LEXICAL_RESOURCE"].evidence_quotes
        assert GRAMMAR_ERROR_QUOTE not in by_code["TASK_RESPONSE"].evidence_quotes

    async def test_lower_scoring_criteria_keep_their_supporting_evidence(
        self, config
    ) -> None:
        """A low band with no evidence is exactly the generic feedback US2 exists to
        eliminate."""
        fake = FakeLLMClient(
            band=5.0,
            quotes_by_criterion={"TASK_RESPONSE": [OFF_TOPIC_QUOTE]},
            quote="reduces congestion",
        )
        outcome = await run_assessment(
            fake, task_type="TASK_2", essay_text=ESSAY_WITH_PLANTED_DEFECTS, config=config
        )

        for criterion in outcome.criteria:
            assert criterion.evidence_quotes, f"{criterion.criterion} lost its evidence"
            assert criterion.explanation.strip()


class TestVerificationRejectsFabrication:
    """T038 — unverifiable quotes must never be persisted or returned."""

    async def test_a_mix_of_real_and_invented_quotes_keeps_only_the_real_ones(
        self, config
    ) -> None:
        fake = FakeLLMClient(
            band=6.0,
            quotes_by_criterion={
                "TASK_RESPONSE": [
                    OFF_TOPIC_QUOTE,  # real
                    "the author explicitly praises the construction of new motorways",  # invented
                ]
            },
            quote="reduces congestion",
        )
        outcome = await run_assessment(
            fake, task_type="TASK_2", essay_text=ESSAY_WITH_PLANTED_DEFECTS, config=config
        )
        task_response = next(
            c for c in outcome.criteria if c.criterion == "TASK_RESPONSE"
        )

        assert task_response.evidence_quotes == [OFF_TOPIC_QUOTE]
        assert task_response.quotes_returned == 2
        assert task_response.quotes_dropped == 1

    def test_verification_is_exact_not_fuzzy(self) -> None:
        """Fuzzy matching would hide fabrication behind a similarity score. A quote
        that is *almost* right is still not something the learner wrote."""
        essay = "The government should invest in public transport."
        assert quote_in_essay("invest in public transport", normalize(essay)) is True
        assert quote_in_essay("invest in public transportation", normalize(essay)) is False

    def test_verification_forgives_whitespace_differences(self) -> None:
        """A model re-emitting a quote with collapsed or expanded spacing is quoting
        faithfully; normalisation must not treat that as fabrication."""
        essay = "The government should invest\n   in public transport."
        verified, dropped = drop_unverified_quotes(["invest  in   public transport"], essay)
        assert dropped == 0 and len(verified) == 1

    def test_verification_forgives_smart_quote_typography(self) -> None:
        """Curly vs straight quotation marks and en/em dashes are typography, not
        different words."""
        essay = "She said “the policy is working” and then moved on — decisively."
        verified, dropped = drop_unverified_quotes(
            ['"the policy is working"', "moved on - decisively"], essay
        )
        assert dropped == 0 and len(verified) == 2

    def test_verification_still_rejects_misplaced_quotation_marks(self) -> None:
        """Forgiving typography must not extend to forgiving a different span: quoting
        `the policy is "working"` is not what the essay actually says."""
        essay = "She said “the policy is working” and moved on."
        verified, dropped = drop_unverified_quotes(['the policy is "working"'], essay)
        assert verified == [] and dropped == 1

    def test_trivially_short_quotes_are_not_accepted_as_evidence(self) -> None:
        """A 1-3 character 'quote' matches almost any essay and proves nothing."""
        verified, dropped = drop_unverified_quotes(["a", "th", "the"], "the essay text")
        assert verified == [] and dropped == 3
