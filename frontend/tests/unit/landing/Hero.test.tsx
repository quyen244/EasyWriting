import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Hero from "@/components/landing/Hero";

describe("Hero", () => {
  it("states the product purpose so a visitor needs no other page (US1 scenario 1)", () => {
    render(<Hero />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/IELTS/i);
  });

  it("names the sub-60-second turnaround the spec's acceptance scenario quotes", () => {
    render(<Hero />);
    expect(screen.getByText(/60 seconds/i)).toBeInTheDocument();
  });

  it("offers a sign-up call to action pointing at account creation (FR-001)", () => {
    render(<Hero />);
    const cta = screen.getAllByRole("link", { name: /score my essay/i })[0];
    expect(cta).toHaveAttribute("href", "/signup");
  });

  it("does not promise the free tier is a crippled trial (US1 scenario 3)", () => {
    render(<Hero />);
    expect(screen.queryByText(/trial/i)).not.toBeInTheDocument();
  });
});
