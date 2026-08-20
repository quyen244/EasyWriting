"""Band arithmetic (T029). No LLM involvement — this is code, not judgement.

Keeping aggregation deterministic is what makes the overall band reproducible and
auditable: the same four criterion bands always produce the same overall band, so a
benchmark comparison measures the criterion evaluators, not aggregation noise.

Ported from the IE AI Evaluator's `src/pipeline/aggregate.py`, with the length-penalty
thresholds lifted out of hardcoded constants into the pipeline YAML (Constitution IV).
"""

from __future__ import annotations

import math

BAND_MIN, BAND_MAX = 1.0, 9.0


def clamp(value: float, low: float = BAND_MIN, high: float = BAND_MAX) -> float:
    return max(low, min(high, value))


def round_to_half(value: float) -> float:
    """Round to the nearest 0.5, rounding .25/.75 UP as IELTS does.

    Python's built-in round() uses banker's rounding, which gets midpoints wrong here
    (round(6.25, 1) surprises people), so the arithmetic is done explicitly.
    """
    return math.floor(value * 2 + 0.5) / 2


def snap_band(value: float) -> tuple[float, bool]:
    """Clamp to [1, 9] and snap to a multiple of 0.5. Returns (band, was_coerced).

    `was_coerced` tells the caller the model returned something off-scale (a 6.3, or a
    12), which is worth recording as a model-quality signal rather than hiding.
    """
    snapped = round_to_half(clamp(value))
    return snapped, abs(snapped - value) > 1e-9


def length_penalty(
    deficit_ratio: float,
    *,
    moderate_deficit_ratio: float = 0.15,
    moderate_penalty: float = 0.5,
    severe_deficit_ratio: float = 0.40,
    severe_penalty: float = 1.0,
) -> float:
    """Penalty applied to the Task Achievement / Task Response band ONLY.

    Real examiners absorb under-length into TA/TR rather than deducting from the
    overall band, so applying it to one criterion avoids double-counting. The scoring
    prompt for TA/TR is explicitly told not to deduct for length itself
    (see LENGTH_RULE_TASK in llm/prompts/builders.py) — the two halves of that
    arrangement must stay in sync.
    """
    if deficit_ratio > severe_deficit_ratio:
        return severe_penalty
    if deficit_ratio > moderate_deficit_ratio:
        return moderate_penalty
    return 0.0


def aggregate_overall(bands: list[float | None]) -> tuple[float, float, bool]:
    """Return (overall_band, raw_mean, partial).

    `partial` is True when at least one criterion is missing, so a degraded run is
    never silently presented as a complete one. FR-012/Constitution I mean a partial
    result must not be shown as a normal score — the API turns this into a failure
    rather than persisting an incomplete AssessmentResult.
    """
    present = [b for b in bands if b is not None]
    if not present:
        return 0.0, 0.0, True
    raw = sum(present) / len(present)
    return round_to_half(clamp(raw)), round(raw, 4), len(present) < len(bands)
