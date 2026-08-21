import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import WhyWriteWiseStats from "@/components/landing/WhyWriteWiseStats";
import { WHY_WRITEWISE_STATS } from "@/lib/whyWriteWise";

/** US3 — FR-009, constitution TP-1. */
describe("WhyWriteWiseStats", () => {
  it("renders all four stat cards (FR-009)", () => {
    render(<WhyWriteWiseStats />);
    for (const card of WHY_WRITEWISE_STATS) {
      expect(screen.getByText(card.stat)).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: card.title })).toBeInTheDocument();
    }
  });

  it("shows each figure's caption next to it, not just the number (FR-009)", () => {
    // A bare "+1.5" reads as a promise. The caption is what turns it into a claim about
    // a population, so it has to render — not merely exist in the data.
    render(<WhyWriteWiseStats />);
    for (const card of WHY_WRITEWISE_STATS) {
      expect(screen.getByText(card.caption)).toBeInTheDocument();
    }
  });

  it("claims no Speaking capability (FR-011)", () => {
    const { container } = render(<WhyWriteWiseStats />);
    expect(container.textContent).not.toMatch(/speaking/i);
  });
});
