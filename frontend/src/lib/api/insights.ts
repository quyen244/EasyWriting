/**
 * What a result means, derived rather than transmitted.
 *
 * Strongest criterion, weakest criterion and the recommendation are all computable from
 * the four bands. Sending them as extra fields would let a service disagree with its own
 * numbers — a "strongest: Lexical Resource" beside a lower Lexical Resource band is the
 * kind of contradiction a learner notices immediately and never trusts again.
 *
 * Pure functions, no locale, no DOM: this is where the arithmetic every screen displays
 * gets pinned down by tests.
 */

import type { CriterionCode, GradingCriterion, GradingResult, TaskType } from "./types";

/**
 * Ties break toward the criterion listed first.
 *
 * `CRITERIA_BY_TASK` puts the task criterion first, so when everything is level the
 * learner is pointed at Task Response / Task Achievement — the one whose improvement
 * moves the other three with it.
 */
export function strongestCriterion(criteria: GradingCriterion[]): GradingCriterion | null {
  if (criteria.length === 0) return null;
  return criteria.reduce((best, current) => (current.band > best.band ? current : best));
}

export function weakestCriterion(criteria: GradingCriterion[]): GradingCriterion | null {
  if (criteria.length === 0) return null;
  return criteria.reduce((worst, current) => (current.band < worst.band ? current : worst));
}

/** The single next action: whatever the weakest criterion says to do. */
export function keyRecommendation(criteria: GradingCriterion[]): string | null {
  return weakestCriterion(criteria)?.improvement ?? null;
}

export interface WordStatus {
  count: number;
  minimum: number;
  /** Positive over the minimum, negative under it. */
  delta: number;
  meetsMinimum: boolean;
}

export function wordStatus(result: {
  word_count: number;
  min_words: number;
}): WordStatus {
  const delta = result.word_count - result.min_words;
  return {
    count: result.word_count,
    minimum: result.min_words,
    delta,
    meetsMinimum: delta >= 0,
  };
}

/** The band as a fraction of the scale, for meters and bars. */
export function bandPercent(band: number, max = 9): number {
  return Math.min(100, Math.max(0, (band / max) * 100));
}

/**
 * A qualitative label for a band, used to colour a score without inventing a grade.
 *
 * Three steps, not nine: a learner reading "developing / competent / strong" learns
 * something, where nine shades of the same colour tell them only that the bar is a bar.
 */
export type BandTone = "developing" | "competent" | "strong";

export function bandTone(band: number): BandTone {
  if (band >= 7) return "strong";
  if (band >= 6) return "competent";
  return "developing";
}

/** Which criteria a learner should be sent to practise, weakest first. */
export function practiceOrder(result: GradingResult): CriterionCode[] {
  return [...result.criteria]
    .sort((a, b) => a.band - b.band)
    .map((criterion) => criterion.code);
}

/**
 * The exam's own weighting: Task 2 counts double.
 *
 * Rounded to the nearest half band, because a mock test that reported 6.33 would be
 * claiming a precision the real test does not use.
 */
export function combinedWritingBand(
  results: { task_type: TaskType; overall_band: number }[],
): number {
  const task1 = results.find((r) => r.task_type === "TASK_1");
  const task2 = results.find((r) => r.task_type === "TASK_2");
  if (!task1 || !task2) {
    const only = task1 ?? task2;
    return only ? only.overall_band : 0;
  }
  return Math.round(((task1.overall_band + task2.overall_band * 2) / 3) * 2) / 2;
}
