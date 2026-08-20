import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import FaqSearch, { filterFaqEntries } from "@/components/faq/FaqSearch";
import { FAQ_ENTRIES } from "@/lib/faqData";

describe("filterFaqEntries", () => {
  it("returns everything for an empty term", () => {
    expect(filterFaqEntries(FAQ_ENTRIES, "")).toHaveLength(FAQ_ENTRIES.length);
  });

  it("ignores surrounding whitespace", () => {
    expect(filterFaqEntries(FAQ_ENTRIES, "   ")).toHaveLength(FAQ_ENTRIES.length);
  });

  it("matches on the question text (FR-014)", () => {
    const matches = filterFaqEntries(FAQ_ENTRIES, "official");
    expect(matches.some((e) => e.id === "is-the-score-official")).toBe(true);
  });

  it("matches on the answer text too", () => {
    // A visitor searching "refund" or "certified" is searching for the concept, and the
    // word they remember is often in the answer rather than the question.
    const matches = filterFaqEntries(FAQ_ENTRIES, "certified");
    expect(matches.some((e) => e.id === "is-the-score-official")).toBe(true);
  });

  it("is case insensitive", () => {
    expect(filterFaqEntries(FAQ_ENTRIES, "OFFICIAL")).toEqual(
      filterFaqEntries(FAQ_ENTRIES, "official"),
    );
  });

  it("returns nothing for a term that matches nothing (edge case: no-match state)", () => {
    expect(filterFaqEntries(FAQ_ENTRIES, "zzzznotathing")).toHaveLength(0);
  });

  it("finds the official-score answer via the term SC-006 measures", () => {
    // SC-006 asks that 90% of visitors find this answer within 30 seconds; searching
    // the obvious word has to surface it.
    expect(filterFaqEntries(FAQ_ENTRIES, "score").length).toBeGreaterThan(0);
  });
});

describe("FaqSearch", () => {
  it("is a labelled search input", () => {
    render(<FaqSearch value="" onChange={vi.fn()} resultCount={FAQ_ENTRIES.length} />);
    expect(screen.getByRole("searchbox", { name: /search/i })).toBeInTheDocument();
  });

  it("reports each keystroke upward", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FaqSearch value="" onChange={onChange} resultCount={12} />);
    await user.type(screen.getByRole("searchbox"), "pay");
    expect(onChange).toHaveBeenCalled();
  });

  it("announces the result count to assistive technology as the list narrows", () => {
    render(<FaqSearch value="official" onChange={vi.fn()} resultCount={1} />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("1");
  });

  it("says plainly when nothing matched", () => {
    render(<FaqSearch value="zzz" onChange={vi.fn()} resultCount={0} />);
    expect(screen.getByRole("status")).toHaveTextContent(/no (questions|matches)/i);
  });

  it("stays quiet when no search is active", () => {
    render(<FaqSearch value="" onChange={vi.fn()} resultCount={12} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
