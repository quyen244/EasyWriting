// Band arithmetic. No model involvement — this is code, not judgement.
//
// Ported from eval/src/pipeline/aggregate.py. Keeping aggregation deterministic is what
// makes the overall band reproducible and auditable: the same four criterion bands
// always produce the same overall band, so the committed benchmark measures the
// criterion evaluators rather than aggregation noise.

export const BAND_MIN = 1.0;
export const BAND_MAX = 9.0;

export function clamp(value: number, low = BAND_MIN, high = BAND_MAX): number {
  return Math.max(low, Math.min(high, value));
}

// Round to the nearest 0.5, rounding .25/.75 UP as IELTS does. Written out rather than
// using a rounding helper because the midpoint behaviour is the whole point.
export function roundToHalf(value: number): number {
  return Math.floor(value * 2 + 0.5) / 2;
}

export interface SnappedBand {
  band: number;
  coerced: boolean;
}

// `coerced` records that the model returned something off-scale (a 6.3, or a 12). It is
// a model-quality signal worth storing on llm_calls, not something to hide.
export function snapBand(value: number): SnappedBand {
  const snapped = roundToHalf(clamp(value));
  return { band: snapped, coerced: Math.abs(snapped - value) > 1e-9 };
}

export interface LengthPenaltyThresholds {
  moderateDeficitRatio: number;
  moderatePenalty: number;
  severeDeficitRatio: number;
  severePenalty: number;
}

// Applied to the Task Achievement / Task Response band ONLY. Real examiners absorb
// under-length into TA/TR rather than deducting from the overall band, so applying it
// to one criterion avoids double-counting. The prompt for TA/TR is explicitly told not
// to deduct for length itself (prompts/v3/length_rule_task.txt) — the two halves of
// that arrangement must stay in sync.
export function lengthPenalty(
  deficitRatio: number,
  t: LengthPenaltyThresholds,
): number {
  if (deficitRatio > t.severeDeficitRatio) return t.severePenalty;
  if (deficitRatio > t.moderateDeficitRatio) return t.moderatePenalty;
  return 0;
}

export interface Aggregated {
  overall: number;
  raw: number;
  partial: boolean;
}

// `partial` is true when a criterion is missing, so a degraded run is never silently
// presented as a complete one. The caller turns it into a failure rather than
// persisting an incomplete result — Constitution I forbids a band without its
// explanation, and `criteria_match_task()` rejects anything short of four criteria.
export function aggregateOverall(bands: (number | null)[]): Aggregated {
  const present = bands.filter((b): b is number => b !== null);
  if (present.length === 0) return { overall: 0, raw: 0, partial: true };
  const raw = present.reduce((a, b) => a + b, 0) / present.length;
  return {
    overall: roundToHalf(clamp(raw)),
    raw: Math.round(raw * 10000) / 10000,
    partial: present.length < bands.length,
  };
}
