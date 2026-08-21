import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HOW_IT_WORKS_STEPS, HowItWorksSection } from "@/components/landing/HowItWorksStep";

/** US3 — FR-007, FR-008, FR-011. */
describe("How it works", () => {
  it("shows exactly the three steps the design names (FR-007)", () => {
    expect(HOW_IT_WORKS_STEPS.map((s) => s.title)).toEqual([
      "Analyze",
      "Evaluate Criteria",
      "Score & Improve",
    ]);
  });

  it("names all four official criteria in the Evaluate step (FR-008)", () => {
    // These must match 001-ielts-score-assessment's criterion set exactly rather than a
    // marketing shorthand of it — the design's own copy says only "TR, CC, LR, and GRA",
    // which is not a name a visitor can check against anything.
    const body = HOW_IT_WORKS_STEPS[1].body;
    for (const criterion of [
      /task response/i,
      /task achievement/i,
      /coherence & cohesion/i,
      /lexical resource/i,
      /grammatical range & accuracy/i,
    ]) {
      expect(body).toMatch(criterion);
    }
  });

  it("does not promise line-by-line corrections the grader cannot produce (FR-011)", () => {
    // The Figma copy reads "line-by-line actionable corrections". 001 returns a band and
    // a per-criterion comment, with no per-sentence rewrites at all, so shipping the
    // design's wording verbatim would have been false on the day it launched.
    const all = HOW_IT_WORKS_STEPS.map((s) => s.body).join(" ");
    expect(all).not.toMatch(/line-by-line/i);
    expect(all).not.toMatch(/corrections/i);
  });

  it("renders every step as a heading", () => {
    render(<HowItWorksSection />);
    for (const step of HOW_IT_WORKS_STEPS) {
      expect(screen.getByRole("heading", { name: step.title })).toBeInTheDocument();
    }
  });

  it("anchors the section so the hero's secondary CTA can reach it", () => {
    const { container } = render(<HowItWorksSection />);
    expect(container.querySelector("#how-it-works")).not.toBeNull();
  });
});
