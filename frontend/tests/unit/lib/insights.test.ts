import { describe, expect, it } from "vitest";

import {
  bandTone,
  combinedWritingBand,
  keyRecommendation,
  strongestCriterion,
  weakestCriterion,
  wordStatus,
  type GradingCriterion,
} from "@/lib/api";

/**
 * The arithmetic the whole result screen displays, pinned down without a DOM.
 *
 * Everything here is derived rather than transmitted, precisely so it cannot contradict
 * the four bands printed beside it — which makes these the tests that protect the
 * product's credibility.
 */

function criterion(
  code: GradingCriterion["code"],
  band: number,
  improvement = `fix ${code}`,
): GradingCriterion {
  return {
    code,
    label: code,
    band,
    comment: `about ${code}`,
    improvement,
    evidence_quotes: [],
  };
}

describe("strongest / weakest", () => {
  const criteria = [
    criterion("TASK_RESPONSE", 6.5),
    criterion("COHERENCE_COHESION", 6.0),
    criterion("LEXICAL_RESOURCE", 7.5),
    criterion("GRAMMATICAL_RANGE", 5.5),
  ];

  it("picks the highest and lowest band", () => {
    expect(strongestCriterion(criteria)?.code).toBe("LEXICAL_RESOURCE");
    expect(weakestCriterion(criteria)?.code).toBe("GRAMMATICAL_RANGE");
  });

  it("breaks a tie toward the criterion listed first", () => {
    // The task criterion is listed first, and it is the one whose improvement drags the
    // other three along with it — so an all-level result should point there.
    const level = [
      criterion("TASK_RESPONSE", 6),
      criterion("COHERENCE_COHESION", 6),
      criterion("LEXICAL_RESOURCE", 6),
      criterion("GRAMMATICAL_RANGE", 6),
    ];
    expect(weakestCriterion(level)?.code).toBe("TASK_RESPONSE");
    expect(strongestCriterion(level)?.code).toBe("TASK_RESPONSE");
  });

  it("recommends the weakest criterion's improvement, not its comment", () => {
    expect(keyRecommendation(criteria)).toBe("fix GRAMMATICAL_RANGE");
  });

  it("returns null rather than throwing on an empty result", () => {
    expect(strongestCriterion([])).toBeNull();
    expect(keyRecommendation([])).toBeNull();
  });
});

describe("wordStatus", () => {
  it("reports a shortfall as a negative delta", () => {
    const status = wordStatus({ word_count: 243, min_words: 250 });
    expect(status.delta).toBe(-7);
    expect(status.meetsMinimum).toBe(false);
  });

  it("treats exactly the minimum as met", () => {
    const status = wordStatus({ word_count: 250, min_words: 250 });
    expect(status.delta).toBe(0);
    expect(status.meetsMinimum).toBe(true);
  });
});

describe("bandTone", () => {
  it("splits the scale into three readable steps", () => {
    expect(bandTone(5.5)).toBe("developing");
    expect(bandTone(6)).toBe("competent");
    expect(bandTone(6.5)).toBe("competent");
    expect(bandTone(7)).toBe("strong");
  });
});

describe("combinedWritingBand", () => {
  it("weights Task 2 double, as the real test does", () => {
    // (6 + 7*2) / 3 = 6.67 → 6.5 at half-band resolution.
    expect(
      combinedWritingBand([
        { task_type: "TASK_1", overall_band: 6 },
        { task_type: "TASK_2", overall_band: 7 },
      ]),
    ).toBe(6.5);
  });

  it("never reports a precision the exam does not use", () => {
    const band = combinedWritingBand([
      { task_type: "TASK_1", overall_band: 5.5 },
      { task_type: "TASK_2", overall_band: 6.5 },
    ]);
    expect(band * 2).toBe(Math.round(band * 2));
  });

  it("falls back to the one task present rather than halving it", () => {
    expect(combinedWritingBand([{ task_type: "TASK_2", overall_band: 7 }])).toBe(7);
  });
});
