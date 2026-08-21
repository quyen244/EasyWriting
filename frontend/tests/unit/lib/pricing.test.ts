import { describe, expect, it } from "vitest";

import { FUTURE_ENTITLEMENT_PATTERN, PRICING_PLANS } from "@/lib/pricing";

/** T006 — data-model.md `Plan`, spec.md FR-012..FR-016. */
describe("PRICING_PLANS", () => {
  it("has exactly four plans: Free, Monthly, Yearly, Lifetime (FR-012)", () => {
    expect(PRICING_PLANS.map((p) => p.name)).toEqual([
      "Free",
      "Monthly",
      "Yearly",
      "Lifetime",
    ]);
  });

  it("marks exactly one plan as recommended (FR-013)", () => {
    // Nothing in a static array enforces this, so it is asserted here instead —
    // data-model.md calls it "a check constraint in spirit".
    expect(PRICING_PLANS.filter((p) => p.recommended)).toHaveLength(1);
  });

  it("transcribes the design's figures without silently correcting them (research.md R3)", () => {
    const byName = Object.fromEntries(PRICING_PLANS.map((p) => [p.name, p]));
    expect(byName.Free.price).toBe("$0");
    expect(byName.Monthly.price).toBe("$4.99");
    expect(byName.Yearly.price).toBe("$49.9");
    expect(byName.Lifetime.price).toBe("$149.9");
  });

  it("describes the Free plan as a real scored result, not a preview (FR-014)", () => {
    const free = PRICING_PLANS[0];
    const text = free.features.join(" ");

    expect(text).toMatch(/scor|band/i);
    for (const crippled of [/preview/i, /demo/i, /trial/i, /sample only/i]) {
      expect(text).not.toMatch(crippled);
    }
  });

  it("bounds the Free plan by a stated daily limit rather than leaving it open", () => {
    expect(PRICING_PLANS[0].features.join(" ")).toMatch(/per day|daily/i);
  });

  it("flags Speaking as included on Yearly and Lifetime only (FR-015)", () => {
    const speaking = PRICING_PLANS.filter((p) => p.speakingIncluded).map((p) => p.name);
    expect(speaking).toEqual(["Yearly", "Lifetime"]);
  });

  it("gives every speakingIncluded plan a feature line the UI can qualify (FR-015)", () => {
    // PricingCard attaches the "not usable yet" qualifier to the Speaking feature line.
    // If a plan claims the entitlement but never names it, that qualifier has nothing
    // to attach to and the claim ships unqualified.
    for (const plan of PRICING_PLANS.filter((p) => p.speakingIncluded)) {
      expect(plan.features.some((f) => FUTURE_ENTITLEMENT_PATTERN.test(f))).toBe(true);
    }
  });

  it("never claims Speaking on a plan that does not carry the flag", () => {
    for (const plan of PRICING_PLANS.filter((p) => !p.speakingIncluded)) {
      expect(plan.features.join(" ")).not.toMatch(/speaking/i);
    }
  });
});
