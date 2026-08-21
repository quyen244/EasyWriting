import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Hero from "@/components/landing/Hero";

/** US1 — FR-001, FR-002. */
describe("Hero", () => {
  it("states the product purpose without any interaction (FR-001)", () => {
    render(<Hero />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/master your ielts writing/i);
    expect(heading).toHaveTextContent(/ai-powered feedback/i);
  });

  it("carries the supporting value line the design specifies", () => {
    render(<Hero />);
    expect(screen.getByText(/examiner-grade evaluations/i)).toBeInTheDocument();
  });

  it("offers a primary sign-up action (FR-002)", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: /get started for free/i })).toHaveAttribute(
      "href",
      "/signup",
    );
  });

  it("offers a secondary action that scrolls rather than navigates (FR-002)", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: /how it works/i })).toHaveAttribute(
      "href",
      "/#how-it-works",
    );
  });

  it("sets the italic emphasis as real emphasis, not a styled span", () => {
    // The design's whole typographic idea is that italic run. Marking it up as <em>
    // conveys the emphasis to a screen reader too, instead of leaving it purely visual.
    //
    // It is split across two elements so "AI-powered" can be kept unbreakable while
    // "feedback" still wraps — hence asserting the joined text rather than one node.
    const { container } = render(<Hero />);
    const italics = Array.from(container.querySelectorAll("h1 em"))
      .map((el) => el.textContent)
      .join(" ");
    expect(italics).toMatch(/ai-powered\s+feedback/i);
  });
});
