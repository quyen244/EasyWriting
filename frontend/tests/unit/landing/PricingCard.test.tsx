import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PricingCard from "@/components/landing/PricingCard";
import { PRICING_PLANS } from "@/lib/pricing";

describe("PRICING_PLANS", () => {
  it("has exactly four plans (FR-017)", () => {
    expect(PRICING_PLANS).toHaveLength(4);
  });

  it("marks exactly one plan as recommended (US1 scenario 3)", () => {
    expect(PRICING_PLANS.filter((p) => p.recommended)).toHaveLength(1);
  });

  it("uses the corrected figures, not the mockup's placeholders (research.md decision 7)", () => {
    // The Stitch mockup shipped $19/mo, 2 essays/month free, and $149 lifetime. Those
    // are wrong, and publishing wrong prices to real visitors is a trust problem rather
    // than a cosmetic one — hence asserting the real numbers rather than trusting review.
    const byName = Object.fromEntries(PRICING_PLANS.map((p) => [p.name, p]));
    expect(byName.Free.price).toBe("$0");
    expect(byName.Free.features[0]).toMatch(/1 essay per day/i);
    expect(byName.Monthly.price).toBe("$4.99");
    expect(byName.Yearly.price).toBe("$49.9");
    expect(byName.Lifetime.price).toBe("$99");
    expect(byName.Yearly.recommended).toBe(true);
  });

  it("never advertises the mockup's placeholder numbers", () => {
    const serialised = JSON.stringify(PRICING_PLANS);
    for (const stale of ["$19", "$149", "2 Essays per month"]) {
      expect(serialised).not.toContain(stale);
    }
  });
});

describe("PricingCard", () => {
  const plan = PRICING_PLANS[0];

  it("renders the plan name, price and features", () => {
    render(<PricingCard plan={plan} />);
    expect(screen.getByText(plan.name)).toBeInTheDocument();
    expect(screen.getByText(plan.price)).toBeInTheDocument();
    for (const feature of plan.features) {
      expect(screen.getByText(feature)).toBeInTheDocument();
    }
  });

  it("routes every plan's CTA to sign-up, since checkout is out of scope (FR-017)", () => {
    render(<PricingCard plan={PRICING_PLANS[3]} />);
    expect(screen.getByRole("link", { name: PRICING_PLANS[3].cta })).toHaveAttribute(
      "href",
      "/signup",
    );
  });

  it("labels the recommended plan in text, not by colour alone", () => {
    // Colour-only emphasis is invisible to a screen-reader user and to anyone with a
    // colour-vision deficiency — the "exactly one recommended" requirement has to be
    // perceivable, not merely styled.
    render(<PricingCard plan={PRICING_PLANS.find((p) => p.recommended)!} />);
    expect(screen.getByText(/recommended/i)).toBeInTheDocument();
  });

  it("does not label a non-recommended plan", () => {
    render(<PricingCard plan={plan} />);
    expect(screen.queryByText(/recommended/i)).not.toBeInTheDocument();
  });
});
