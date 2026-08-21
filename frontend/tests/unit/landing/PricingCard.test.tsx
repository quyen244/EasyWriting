import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PricingCard from "@/components/landing/PricingCard";
import { PRICING_PLANS } from "@/lib/pricing";

/** US4 — FR-013, FR-015, FR-016. */
describe("PricingCard", () => {
  const free = PRICING_PLANS[0];
  const yearly = PRICING_PLANS.find((p) => p.recommended)!;
  const lifetime = PRICING_PLANS[3];

  it("renders the plan name, price and tagline", () => {
    render(<PricingCard plan={free} />);
    expect(screen.getByRole("heading", { name: free.name })).toBeInTheDocument();
    expect(screen.getByText(free.price)).toBeInTheDocument();
    expect(screen.getByText(free.tagline)).toBeInTheDocument();
  });

  it("carries the plan identity into sign-up (FR-016)", () => {
    render(<PricingCard plan={yearly} />);
    expect(screen.getByRole("link", { name: yearly.cta })).toHaveAttribute(
      "href",
      "/signup?plan=yearly",
    );
  });

  it("marks the recommended plan in text, not by colour alone (FR-013)", () => {
    render(<PricingCard plan={yearly} />);
    expect(screen.getByText(/recommended/i)).toBeInTheDocument();
  });

  it("does not mark a non-recommended plan as recommended", () => {
    render(<PricingCard plan={free} />);
    expect(screen.queryByText(/recommended/i)).not.toBeInTheDocument();
  });

  it("qualifies the Speaking entitlement in the UI, not just in the data (FR-015)", () => {
    // Speaking does not exist yet. Listing it unqualified beside features that do work
    // would read as something the buyer gets access to on purchase.
    render(<PricingCard plan={yearly} />);
    expect(screen.getByText(/not available yet/i)).toBeInTheDocument();
  });

  it("qualifies an all-future-features promise the same way (FR-015)", () => {
    render(<PricingCard plan={lifetime} />);
    expect(screen.getByText(/not available yet/i)).toBeInTheDocument();
  });

  it("adds no qualifier to a plan that promises nothing future", () => {
    render(<PricingCard plan={free} />);
    expect(screen.queryByText(/not available yet/i)).not.toBeInTheDocument();
  });
});
