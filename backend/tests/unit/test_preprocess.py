"""Deterministic text analysis and the FR-007 scoreability gate.

The gate matters disproportionately: a false rejection costs a real learner their
submission, so these tests pin both what MUST be rejected and — equally important —
what must NOT be.
"""

from __future__ import annotations

from src.pipeline.preprocess import extract_features, find_unscoreable_reason
from tests.conftest import TASK_2_ESSAY


class TestExtractFeatures:
    def test_counts_words_sentences_and_paragraphs(self) -> None:
        features = extract_features(TASK_2_ESSAY, "TASK_2")
        assert features.word_count > 250
        assert features.sentence_count > 10
        assert features.paragraph_count == 5

    def test_task_1_and_task_2_have_different_minimums(self) -> None:
        assert extract_features("word " * 200, "TASK_1").min_words_required == 150
        assert extract_features("word " * 200, "TASK_2").min_words_required == 250

    def test_deficit_ratio_is_zero_when_minimum_is_met(self) -> None:
        assert extract_features(TASK_2_ESSAY, "TASK_2").length_deficit_ratio == 0.0

    def test_deficit_ratio_reflects_how_far_under_the_minimum(self) -> None:
        # 125 words against a 250 minimum -> exactly 50% deficit.
        features = extract_features("word " * 125, "TASK_2")
        assert features.length_deficit_ratio == 0.5
        assert features.meets_min_words is False

    def test_detects_cohesive_devices_actually_present(self) -> None:
        found = extract_features(TASK_2_ESSAY, "TASK_2").cohesive_devices_found
        assert "however" not in found, "essay uses 'Nevertheless', not 'however'"
        assert "nevertheless" in found
        assert "in conclusion" in found
        assert "furthermore" in found

    def test_type_token_ratio_is_low_for_repetitive_text(self) -> None:
        repetitive = extract_features("apple banana " * 60, "TASK_2")
        varied = extract_features(TASK_2_ESSAY, "TASK_2")
        assert repetitive.type_token_ratio < varied.type_token_ratio


class TestScoreabilityGate:
    def _reason(self, text: str, task_type: str = "TASK_2") -> str | None:
        return find_unscoreable_reason(text, extract_features(text, task_type))

    # --- must be rejected -------------------------------------------------
    def test_empty_submission_is_unscoreable(self) -> None:
        assert self._reason("   ") is not None

    def test_very_short_submission_is_unscoreable(self) -> None:
        assert self._reason("Too short.") is not None

    def test_non_english_submission_is_unscoreable(self) -> None:
        reason = self._reason("这是一篇中文文章。" * 30)
        assert reason is not None and "English" in reason

    def test_repeated_gibberish_is_unscoreable(self) -> None:
        reason = self._reason("aaaa " * 100)
        assert reason is not None and "not recognizable" in reason

    def test_long_text_with_no_sentence_structure_is_unscoreable(self) -> None:
        reason = self._reason(" ".join(f"token{i}" for i in range(120)))
        assert reason is not None

    # --- must NOT be rejected ---------------------------------------------
    def test_a_real_essay_is_scoreable(self) -> None:
        assert self._reason(TASK_2_ESSAY) is None

    def test_a_short_but_genuine_essay_is_scoreable_not_unscoreable(self) -> None:
        """Under the word minimum is BELOW_MIN_WORDS (a different, recoverable error),
        NOT 'unscoreable'. Conflating them would tell a learner their perfectly good
        essay is gibberish."""
        short_essay = (
            "Many people believe that education should be free for everyone. "
            "I agree with this view for two main reasons. First, free education "
            "increases social mobility. Second, it benefits the wider economy. "
            "In conclusion, governments should fund education fully. "
        ) * 3
        assert self._reason(short_essay) is None

    def test_weak_learner_english_is_still_scoreable(self) -> None:
        """A band-4 essay is full of errors but is emphatically still an essay — the
        rubric exists to score it, not the gate to reject it."""
        weak = (
            "I think social media is very good for people. Many people use it "
            "everyday for talk with friend and family. Some people say it is bad "
            "because young people spend too much time. But i think if you use "
            "carefully it is helpful. In my country many student use it for study. "
        ) * 6
        assert self._reason(weak) is None
