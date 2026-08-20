"""Deterministic band arithmetic (T023).

These are the only parts of scoring that are pure code, so they are the only parts that
can be pinned exactly. If aggregation drifts, every benchmark comparison becomes
meaningless — a change in the criterion evaluators would be indistinguishable from a
change in how their outputs are combined.
"""

from __future__ import annotations

import pytest

from src.pipeline.aggregate import (
    aggregate_overall,
    clamp,
    length_penalty,
    round_to_half,
    snap_band,
)


class TestRoundToHalf:
    @pytest.mark.parametrize(
        "value,expected",
        [
            (6.0, 6.0),
            (6.24, 6.0),
            (6.26, 6.5),
            (6.74, 6.5),
            (6.76, 7.0),
        ],
    )
    def test_rounds_to_nearest_half(self, value: float, expected: float) -> None:
        assert round_to_half(value) == expected

    @pytest.mark.parametrize("value,expected", [(6.25, 6.5), (6.75, 7.0), (5.25, 5.5)])
    def test_midpoints_round_up_not_bankers(self, value: float, expected: float) -> None:
        """IELTS rounds .25/.75 UP. Python's round() uses banker's rounding and would
        give 6.2 -> 6.2 or round-half-to-even surprises, so the arithmetic is explicit."""
        assert round_to_half(value) == expected


class TestClampAndSnap:
    def test_clamp_bounds_to_valid_band_range(self) -> None:
        assert clamp(0.5) == 1.0
        assert clamp(12.0) == 9.0
        assert clamp(6.5) == 6.5

    def test_snap_reports_coercion_when_model_returns_off_scale_band(self) -> None:
        band, coerced = snap_band(6.3)
        assert band == 6.5
        assert coerced is True

    def test_snap_reports_no_coercion_for_a_valid_band(self) -> None:
        band, coerced = snap_band(6.5)
        assert band == 6.5
        assert coerced is False

    def test_snap_clamps_absurd_model_output(self) -> None:
        assert snap_band(99.0)[0] == 9.0
        assert snap_band(-4.0)[0] == 1.0


class TestLengthPenalty:
    @pytest.mark.parametrize(
        "deficit,expected",
        [
            (0.0, 0.0),
            (0.10, 0.0),
            (0.15, 0.0),  # boundary is exclusive: exactly 15% is not yet penalised
            (0.16, 0.5),
            (0.40, 0.5),  # exactly 40% is still the moderate penalty
            (0.41, 1.0),
            (0.90, 1.0),
        ],
    )
    def test_penalty_tiers(self, deficit: float, expected: float) -> None:
        assert length_penalty(deficit) == expected

    def test_thresholds_are_configurable_from_pipeline_yaml(self) -> None:
        """Constitution IV: scoring parameters come from the versioned config, so the
        defaults must not be baked in."""
        assert (
            length_penalty(
                0.20,
                moderate_deficit_ratio=0.25,
                moderate_penalty=0.5,
                severe_deficit_ratio=0.50,
                severe_penalty=1.0,
            )
            == 0.0
        )


class TestAggregateOverall:
    def test_mean_of_four_bands_snapped_to_half(self) -> None:
        overall, raw, partial = aggregate_overall([6.0, 6.0, 6.5, 7.0])
        assert raw == 6.375
        assert overall == 6.5
        assert partial is False

    def test_identical_bands_aggregate_to_that_band(self) -> None:
        overall, raw, partial = aggregate_overall([6.0, 6.0, 6.0, 6.0])
        assert (overall, raw, partial) == (6.0, 6.0, False)

    def test_missing_criterion_marks_result_partial(self) -> None:
        overall, _, partial = aggregate_overall([7.0, 7.0, None, 7.0])
        assert partial is True
        assert overall == 7.0, "surviving criteria still aggregate"

    def test_all_criteria_missing_is_partial_not_a_crash(self) -> None:
        overall, raw, partial = aggregate_overall([None, None, None, None])
        assert (overall, raw, partial) == (0.0, 0.0, True)

    def test_penalised_task_criterion_pulls_the_overall_down(self) -> None:
        """Mirrors the real flow: TR penalised 6.0 -> 5.5, others untouched."""
        overall, raw, _ = aggregate_overall([5.5, 6.0, 6.0, 6.0])
        assert raw == 5.875
        assert overall == 6.0
