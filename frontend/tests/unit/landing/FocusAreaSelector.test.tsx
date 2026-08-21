import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import FocusAreaSelector from "@/components/landing/FocusAreaSelector";

/** US2 — FR-004, FR-005, FR-006. */
describe("FocusAreaSelector", () => {
  it("presents exactly two focus areas (FR-004)", () => {
    render(<FocusAreaSelector />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual(["Writing", "Speaking"]);
  });

  it("gives each area a one-line description of what it assesses (FR-004)", () => {
    render(<FocusAreaSelector />);
    expect(screen.getByText(/detailed criteria breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/fluency and pronunciation analysis/i)).toBeInTheDocument();
  });

  it("sends Writing toward the actual grader, not a placeholder (FR-005)", () => {
    render(<FocusAreaSelector />);
    expect(screen.getByRole("link", { name: /writing/i })).toHaveAttribute("href", "/workspace");
  });

  it("renders Speaking as no link at all, so there is nothing to click (FR-006)", () => {
    // The two cards are visually symmetrical by design, which is exactly the risk here.
    // If Speaking were an anchor, a visitor could reach something that cannot assess
    // them — the card being inert is what makes the symmetry safe.
    render(<FocusAreaSelector />);
    expect(screen.queryByRole("link", { name: /speaking/i })).not.toBeInTheDocument();
  });

  it("marks Speaking as coming soon in text, not by tint alone (FR-006)", () => {
    render(<FocusAreaSelector />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it("announces the Speaking card as disabled to assistive tech (FR-006)", () => {
    const { container } = render(<FocusAreaSelector />);
    const disabled = container.querySelector("[aria-disabled='true']");
    expect(disabled).not.toBeNull();
    expect(disabled).toHaveTextContent(/speaking/i);
  });
});
