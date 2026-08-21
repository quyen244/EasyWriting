import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ScoringDemo from "@/components/landing/ScoringDemo";
import { DEMO_CRITERIA, DEMO_OVERALL } from "@/components/landing/ScoringDemo.data";

/**
 * The hero's demo panel.
 *
 * These assert the two things about it that are not cosmetic: that it stays out of the
 * accessibility tree (it loops forever, so announcing it would make the page unusable),
 * and that the band it displays is labelled provisional, which constitution TP-1
 * requires wherever a band appears.
 */

/** Forces `useReducedMotion()` to report a reader who has asked for less motion. */
function preferReducedMotion() {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ScoringDemo", () => {
  it("keeps the looping panel out of the accessibility tree", () => {
    // A live region that rewrites itself several times a second, forever, is worse than
    // no description at all.
    const { container } = render(<ScoringDemo />);
    expect(container.querySelector("[aria-hidden='true']")).not.toBeNull();
  });

  it("describes in text what the panel depicts", () => {
    render(<ScoringDemo />);
    expect(screen.getByText(/illustration of the grader at work/i)).toBeInTheDocument();
  });

  it("contains nothing focusable, since the whole panel is hidden", () => {
    // The tabs and the "Xem bài mẫu" footer are a depiction of controls, not controls.
    // Anything focusable inside an aria-hidden subtree is a focus trap for a keyboard
    // user: reachable by Tab, but invisible to their screen reader.
    const { container } = render(<ScoringDemo />);
    const hidden = container.querySelector("[aria-hidden='true']") as HTMLElement;
    expect(hidden.querySelectorAll("a, button, input, select, textarea, [tabindex]")).toHaveLength(
      0,
    );
  });

  it("presents the band as provisional, never as a result (TP-1)", () => {
    render(<ScoringDemo />);
    expect(screen.getByText(/provisional estimate/i)).toBeInTheDocument();
  });

  it("renders the finished state when the reader has asked for less motion", () => {
    // The loop never starts. What stays on screen is the one frame that makes sense on
    // its own — the revealed score — rather than a half-typed essay frozen mid-word.
    preferReducedMotion();
    render(<ScoringDemo />);

    // "Overall band" and "7.5" each appear twice — once inside the panel, once in the
    // sr-only sentence that stands in for it — so these count rather than expecting a
    // single node.
    expect(screen.getAllByText(/overall band/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(DEMO_OVERALL.toFixed(1)).length).toBeGreaterThan(0);
    for (const criterion of DEMO_CRITERIA) {
      expect(screen.getByText(criterion.short)).toBeInTheDocument();
    }
  });

  it("scores against the four official criteria", () => {
    // Not three, and not a fifth invented one: the panel depicts the same rubric the
    // grader actually applies.
    expect(DEMO_CRITERIA).toHaveLength(4);
    expect(DEMO_CRITERIA.map((c) => c.short)).toEqual(["TR", "CC", "LR", "GRA"]);
    for (const criterion of DEMO_CRITERIA) {
      expect(criterion.band).toBeGreaterThanOrEqual(0);
      expect(criterion.band).toBeLessThanOrEqual(9);
    }
  });
});
