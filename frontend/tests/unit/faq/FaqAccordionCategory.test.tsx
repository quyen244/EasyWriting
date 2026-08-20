import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import FaqAccordionCategory from "@/components/faq/FaqAccordionCategory";
import type { FaqEntry } from "@/lib/faqData";

const ENTRIES: FaqEntry[] = [
  { id: "a", category: "Getting Started", question: "First question?", answer: "First answer." },
  { id: "b", category: "Getting Started", question: "Second question?", answer: "Second answer." },
];

function renderCategory(openId: string | null = null) {
  const onToggle = vi.fn();
  render(
    <FaqAccordionCategory
      category="Getting Started"
      entries={ENTRIES}
      openId={openId}
      onToggle={onToggle}
    />,
  );
  return onToggle;
}

describe("FaqAccordionCategory", () => {
  it("renders the category heading and every question", () => {
    renderCategory();
    expect(screen.getByRole("heading", { name: "Getting Started" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /first question/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /second question/i })).toBeInTheDocument();
  });

  it("keeps answers hidden until opened", () => {
    renderCategory();
    expect(screen.queryByText("First answer.")).not.toBeInTheDocument();
  });

  it("shows only the answer whose id is open (FR-016)", () => {
    renderCategory("a");
    expect(screen.getByText("First answer.")).toBeInTheDocument();
    expect(screen.queryByText("Second answer.")).not.toBeInTheDocument();
  });

  it("reports the clicked question upward so the parent can enforce single-open", () => {
    // The single-open rule is per category, so the parent owns it — a category that
    // tracked its own open id could not stop two categories fighting over one state.
    const onToggle = renderCategory();
    return userEvent
      .setup()
      .click(screen.getByRole("button", { name: /second question/i }))
      .then(() => expect(onToggle).toHaveBeenCalledWith("b"));
  });

  it("reports the same id again when the open question is clicked, so it can close", async () => {
    const onToggle = renderCategory("a");
    await userEvent.setup().click(screen.getByRole("button", { name: /first question/i }));
    expect(onToggle).toHaveBeenCalledWith("a");
  });

  it("exposes expanded state to assistive technology", () => {
    renderCategory("a");
    expect(screen.getByRole("button", { name: /first question/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("button", { name: /second question/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("renders nothing at all when every question was filtered out by search", () => {
    // Otherwise a search shows three empty category headings and reads as broken.
    const { container } = render(
      <FaqAccordionCategory
        category="Getting Started"
        entries={[]}
        openId={null}
        onToggle={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
