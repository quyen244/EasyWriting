import { describe, expect, it } from "vitest";

import { FAQ_TEASER_ITEMS } from "@/lib/faqTeaser";

/** T012 — data-model.md `FaqTeaserItem`, spec.md FR-020, research.md R6. */
describe("FAQ_TEASER_ITEMS", () => {
  it("has exactly three items (FR-020)", () => {
    expect(FAQ_TEASER_ITEMS).toHaveLength(3);
  });

  it("asks the three questions the design specifies", () => {
    const questions = FAQ_TEASER_ITEMS.map((i) => i.question);
    expect(questions[0]).toMatch(/how accurate/i);
    expect(questions[1]).toMatch(/task 1 and task 2/i);
    expect(questions[2]).toMatch(/why i got a certain score/i);
  });

  it("answers every question", () => {
    for (const item of FAQ_TEASER_ITEMS) {
      expect(item.answer.trim().length, `"${item.question}" has no answer`).toBeGreaterThan(20);
    }
  });

  it("never claims machine-verified verbatim quoting (research.md R6, FR-011)", () => {
    // `faqData.ts` still carries "quotes taken verbatim from your essay" — a claim
    // written for the retired four-call pipeline. 001's current grader returns a band
    // and a bilingual comment per criterion; evidence-quote anchoring is exactly what
    // constitution TP-1 leaves open. Re-publishing that wording here would make FR-011
    // false the moment this page shipped.
    const text = FAQ_TEASER_ITEMS.map((i) => i.answer).join(" ");
    for (const overclaim of [/verbatim/i, /exact quote/i, /quotes? taken from/i]) {
      expect(text).not.toMatch(overclaim);
    }
  });

  it("is honest that a submission is one task, not a timed mock test (US6 scenario 3)", () => {
    const answer = FAQ_TEASER_ITEMS[1].answer;
    expect(answer).toMatch(/task 1/i);
    expect(answer).toMatch(/task 2/i);
    expect(answer).toMatch(/one (?:task )?at a time|one task per|separate/i);
  });

  it("describes explainability as a per-criterion comment (US6 scenario 4)", () => {
    expect(FAQ_TEASER_ITEMS[2].answer).toMatch(/criterion|criteria/i);
    expect(FAQ_TEASER_ITEMS[2].answer).toMatch(/comment|explain/i);
  });
});
