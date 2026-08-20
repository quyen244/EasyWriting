import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ComparisonTable from "@/components/landing/ComparisonTable";

describe("ComparisonTable", () => {
  it("compares on all four dimensions FR-002 names", () => {
    render(<ComparisonTable />);
    for (const dimension of [
      /turnaround time/i,
      /feedback detail/i,
      /cost/i,
      /availability/i,
    ]) {
      expect(screen.getByText(dimension)).toBeInTheDocument();
    }
  });

  it("names both sides of the comparison", () => {
    render(<ComparisonTable />);
    const header = within(screen.getByRole("table")).getAllByRole("columnheader");
    const labels = header.map((cell) => cell.textContent);
    expect(labels.some((l) => /writewise/i.test(l ?? ""))).toBe(true);
    expect(labels.some((l) => /traditional tutors?/i.test(l ?? ""))).toBe(true);
  });

  it("is a real table, so screen readers announce row/column relationships", () => {
    // The mockup renders this as styled divs. A comparison is tabular data; making it a
    // grid of divs would leave a screen-reader user unable to tell which value belongs
    // to which side — an SC-007-adjacent accessibility failure.
    render(<ComparisonTable />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("row").length).toBeGreaterThanOrEqual(5);
  });

  it("keeps the sub-60-second claim consistent with the hero", () => {
    render(<ComparisonTable />);
    expect(screen.getByText(/60 seconds/i)).toBeInTheDocument();
  });
});
