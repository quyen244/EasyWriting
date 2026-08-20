import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EmptyState from "@/components/workspace/EmptyState";

describe("EmptyState", () => {
  it("invites a first submission rather than showing a blank panel (FR-007)", () => {
    render(<EmptyState />);
    expect(screen.getByRole("heading").textContent).toBeTruthy();
  });

  it("tells a first-time learner concretely what to do (SC-005)", () => {
    // SC-005 requires this to be actionable without external help, so it must name the
    // action, not just say "nothing here yet".
    render(<EmptyState />);
    expect(screen.getByText(/paste|write|submit/i)).toBeInTheDocument();
  });

  it("sets expectations about how long scoring takes", () => {
    render(<EmptyState />);
    expect(screen.getByText(/second/i)).toBeInTheDocument();
  });

  it("is not presented as an error", () => {
    render(<EmptyState />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
