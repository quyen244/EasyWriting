import { describe, expect, it } from "vitest";

import { WHY_WRITEWISE_STATS } from "@/lib/whyWriteWise";

/** T014 — data-model.md `StatCard`, spec.md FR-009, constitution TP-1. */
describe("WHY_WRITEWISE_STATS", () => {
  it("has exactly four stat cards (FR-009)", () => {
    expect(WHY_WRITEWISE_STATS).toHaveLength(4);
  });

  it("gives every card a figure, a title and a caption", () => {
    for (const card of WHY_WRITEWISE_STATS) {
      expect(card.stat.trim()).not.toBe("");
      expect(card.title.trim()).not.toBe("");
      expect(card.caption.trim()).not.toBe("");
    }
  });

  it("never presents a figure as a promised individual outcome (FR-009, TP-1)", () => {
    // TP-1 requires scores be presented as provisional. "You will gain +1.5 bands" is
    // a promise about one reader; "+1.5 average across regular users" is a claim about
    // a population. Only the second is one this product can stand behind.
    const promises = [
      /\byou will\b/i,
      /\byou'll\b/i,
      /\bwe guarantee\b/i,
      /\bguaranteed\b/i,
      /\bis guaranteed to\b/i,
      /\bevery (?:student|learner|user) gains\b/i,
    ];

    for (const card of WHY_WRITEWISE_STATS) {
      for (const promise of promises) {
        expect(card.caption, `"${card.title}" reads as a promise`).not.toMatch(promise);
      }
    }
  });

  it("qualifies the band-improvement figure as an aggregate (FR-009)", () => {
    const gain = WHY_WRITEWISE_STATS.find((c) => c.stat.startsWith("+"));
    expect(gain, "no band-improvement card found").toBeDefined();
    expect(gain!.caption).toMatch(/average|aggregate|illustrative|typical|vary/i);
  });

  it("claims no Speaking capability anywhere in the stats (FR-011)", () => {
    const text = WHY_WRITEWISE_STATS.map((c) => `${c.title} ${c.caption}`).join(" ");
    expect(text).not.toMatch(/speaking/i);
  });
});
