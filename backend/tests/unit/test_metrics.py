"""Benchmark metrics (T042).

These metrics are the evidence base for Constitution Principle IV — a methodology
change ships or doesn't based on what they say. If they are wrong, every scoring
decision downstream is made on bad information, so they get pinned hard.
"""

from __future__ import annotations

import math

import pytest

from src.evaluation.metrics import (
    bias,
    mae,
    percentile,
    rmse,
    score_block,
    spearman_rho,
    within,
)


class TestErrorMetrics:
    def test_perfect_prediction_has_zero_error(self) -> None:
        pred = gold = [5.0, 6.5, 7.0, 8.0]
        assert mae(pred, gold) == 0.0
        assert rmse(pred, gold) == 0.0
        assert bias(pred, gold) == 0.0

    def test_mae_is_mean_absolute_error(self) -> None:
        assert mae([6.0, 7.0], [5.0, 5.0]) == 1.5

    def test_rmse_punishes_large_errors_more_than_mae(self) -> None:
        pred, gold = [5.0, 9.0], [5.0, 5.0]
        assert mae(pred, gold) == 2.0
        assert rmse(pred, gold) > 2.0

    def test_bias_sign_shows_direction_of_disagreement(self) -> None:
        """Positive = the system is more generous than the human rater. The sign is the
        actionable part: it says which way to adjust the prompt."""
        assert bias([7.0, 7.0], [6.0, 6.0]) == 1.0
        assert bias([5.0, 5.0], [6.0, 6.0]) == -1.0

    def test_bias_cancels_where_mae_does_not(self) -> None:
        """A scorer wrong in both directions has ~zero bias but real error — which is
        exactly why both are reported."""
        pred, gold = [7.0, 5.0], [6.0, 6.0]
        assert bias(pred, gold) == 0.0
        assert mae(pred, gold) == 1.0


class TestWithinTolerance:
    def test_counts_predictions_inside_the_band(self) -> None:
        assert within([6.0, 6.5, 8.0], [6.0, 6.0, 6.0], 0.5) == pytest.approx(2 / 3)

    def test_boundary_is_inclusive(self) -> None:
        """SC-002 says 'within 0.5 band', so exactly 0.5 must count as within."""
        assert within([6.5], [6.0], 0.5) == 1.0

    def test_empty_input_is_zero_not_a_crash(self) -> None:
        assert within([], [], 0.5) == 0.0


class TestSpearman:
    def test_perfect_ranking_is_one(self) -> None:
        assert spearman_rho([1.0, 2.0, 3.0, 4.0], [5.0, 6.0, 7.0, 8.0]) == 1.0

    def test_reversed_ranking_is_minus_one(self) -> None:
        assert spearman_rho([4.0, 3.0, 2.0, 1.0], [5.0, 6.0, 7.0, 8.0]) == -1.0

    def test_handles_ties_without_error(self) -> None:
        """Band scores tie constantly, so tie handling is the normal case here."""
        rho = spearman_rho([6.0, 6.0, 7.0, 8.0], [6.0, 6.5, 7.0, 8.0])
        assert 0.9 <= rho <= 1.0

    def test_constant_prediction_yields_nan_not_a_fake_correlation(self) -> None:
        """All ranks tied means zero variance — undefined, not zero. Reporting 0.0 here
        would understate how broken a constant scorer is."""
        assert math.isnan(spearman_rho([6.5] * 5, [4.0, 5.0, 6.0, 7.0, 8.0]))

    def test_too_few_samples_is_nan(self) -> None:
        assert math.isnan(spearman_rho([1.0, 2.0], [1.0, 2.0]))


class TestScoreBlock:
    def test_reports_the_full_bundle(self) -> None:
        block = score_block([6.0, 6.5, 7.0, 8.0], [6.0, 6.0, 7.5, 8.0])
        assert set(block) == {
            "n", "mae", "rmse", "bias", "within_0.5", "within_1.0",
            "spearman_rho", "pred_std", "gold_std", "std_ratio",
        }
        assert block["n"] == 4

    def test_empty_block_reports_n_zero_only(self) -> None:
        assert score_block([], []) == {"n": 0}

    def test_constant_predictor_is_exposed_by_std_ratio_and_rho(self) -> None:
        """The central-tendency failure mode: predict the dataset mean for everything
        and MAE looks tolerable while the scorer has learned nothing. std_ratio 0 and
        rho None are what make that visible in a report."""
        gold = [4.5, 5.5, 6.5, 7.5, 8.0]
        block = score_block([6.5] * 5, gold)

        assert block["pred_std"] == 0.0
        assert block["std_ratio"] == 0.0
        assert block["spearman_rho"] is None
        assert block["mae"] < 1.5, "MAE alone would look survivable — hence the others"

    def test_spearman_is_json_serialisable(self) -> None:
        """nan is not valid JSON; metrics.json must round-trip."""
        import json

        block = score_block([6.5] * 5, [4.0, 5.0, 6.0, 7.0, 8.0])
        assert json.loads(json.dumps(block))["spearman_rho"] is None

    def test_std_ratio_near_one_means_matching_spread(self) -> None:
        gold = [4.0, 5.0, 6.0, 7.0, 8.0]
        assert score_block(list(gold), gold)["std_ratio"] == 1.0


class TestPercentile:
    def test_median_and_extremes(self) -> None:
        values = [1.0, 2.0, 3.0, 4.0, 5.0]
        assert percentile(values, 0.0) == 1.0
        assert percentile(values, 0.5) == 3.0
        assert percentile(values, 1.0) == 5.0

    def test_empty_is_zero(self) -> None:
        assert percentile([], 0.95) == 0.0
