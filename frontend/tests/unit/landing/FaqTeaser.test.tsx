import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import FaqTeaser from "@/components/landing/FaqTeaser";
import { FAQ_TEASER_ITEMS } from "@/lib/faqTeaser";

/** US6 — FR-020, SC-007. */
describe("FaqTeaser", () => {
  it("shows exactly three questions (FR-020)", () => {
    const { container } = render(<FaqTeaser />);
    expect(container.querySelectorAll("details")).toHaveLength(3);
  });

  it("renders each question and its answer", () => {
    render(<FaqTeaser />);
    for (const item of FAQ_TEASER_ITEMS) {
      expect(screen.getByText(item.question)).toBeInTheDocument();
      expect(screen.getByText(item.answer)).toBeInTheDocument();
    }
  });

  it("starts with every item collapsed and independent (FR-020)", () => {
    // Native <details> gives independent expand/collapse and keyboard operation for
    // free and correctly. A JS accordion would have to re-implement both, and the
    // usual re-implementation closes siblings — which FR-020 explicitly forbids.
    const { container } = render(<FaqTeaser />);
    for (const details of Array.from(container.querySelectorAll("details"))) {
      expect(details.hasAttribute("open")).toBe(false);
    }
  });

  it("expands without navigating anywhere (SC-007)", () => {
    const { container } = render(<FaqTeaser />);
    expect(container.querySelectorAll("details a")).toHaveLength(0);
  });
});
