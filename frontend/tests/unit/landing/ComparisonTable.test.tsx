import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ComparisonTable from "@/components/landing/ComparisonTable";

/** US3 — FR-010, FR-011. */
describe("ComparisonTable", () => {
  it("names all three columns the design compares (FR-010)", () => {
    render(<ComparisonTable />);
    for (const name of [/traditional teacher/i, /other ai tools/i, /^writewise$/i]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
  });

  it("marks WriteWise as the recommended choice in text, not colour alone (FR-010)", () => {
    render(<ComparisonTable />);
    expect(screen.getByText(/best choice/i)).toBeInTheDocument();
  });

  it("compares turnaround, cost and objectivity (FR-010)", () => {
    render(<ComparisonTable />);
    expect(screen.getByText(/2-5 days/i)).toBeInTheDocument();
    expect(screen.getByText(/per essay/i)).toBeInTheDocument();
    expect(screen.getByText(/subjective scoring/i)).toBeInTheDocument();
    expect(screen.getByText(/objective scoring/i)).toBeInTheDocument();
  });

  it("claims nothing about Speaking, which does not exist yet (FR-011)", () => {
    const { container } = render(<ComparisonTable />);
    expect(container.textContent).not.toMatch(/speaking/i);
  });

  it("keeps the sub-one-minute claim consistent with the stat cards", () => {
    render(<ComparisonTable />);
    expect(screen.getByText(/1 min/i)).toBeInTheDocument();
  });
});
