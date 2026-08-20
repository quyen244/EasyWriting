import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HowItWorksStep, { HOW_IT_WORKS_STEPS } from "@/components/landing/HowItWorksStep";

describe("HOW_IT_WORKS_STEPS", () => {
  it("has the four steps FR-003 names, in order", () => {
    expect(HOW_IT_WORKS_STEPS.map((s) => s.title)).toEqual([
      "Submit",
      "Get scored",
      "Learn the fix",
      "Track trend",
    ]);
  });

  it("marks exactly the two not-yet-built steps as future", () => {
    // FR-003 is a truthfulness requirement, not a layout one: implying a capability
    // exists when it does not is the specific failure it guards against.
    const future = HOW_IT_WORKS_STEPS.filter((s) => s.future).map((s) => s.title);
    expect(future).toEqual(["Learn the fix", "Track trend"]);
  });
});

describe("HowItWorksStep", () => {
  it("renders the step number, title and description", () => {
    render(<HowItWorksStep step={HOW_IT_WORKS_STEPS[0]} index={0} />);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("Submit")).toBeInTheDocument();
  });

  it("marks a future step with visible text, not styling alone", () => {
    render(<HowItWorksStep step={HOW_IT_WORKS_STEPS[2]} index={2} />);
    expect(screen.getByText(/coming soon|not yet available|planned/i)).toBeInTheDocument();
  });

  it("does not mark an available step as future", () => {
    render(<HowItWorksStep step={HOW_IT_WORKS_STEPS[1]} index={1} />);
    expect(screen.queryByText(/coming soon|not yet available|planned/i)).not.toBeInTheDocument();
  });

  it("describes the available steps in terms of what today's product actually does", () => {
    // "Get scored" must not promise the per-sentence corrections that belong to the
    // still-unbuilt "Learn the fix" step — that is the same over-claim FR-003 forbids.
    render(<HowItWorksStep step={HOW_IT_WORKS_STEPS[1]} index={1} />);
    expect(screen.getByText(/four/i)).toBeInTheDocument();
  });
});
