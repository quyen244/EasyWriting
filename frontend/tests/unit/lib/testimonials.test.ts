import { describe, expect, it } from "vitest";

import { ALL_TESTIMONIALS, TESTIMONIALS } from "@/lib/testimonials";

/** T010 — data-model.md `Testimonial`, spec.md FR-017, FR-018. */
describe("TESTIMONIALS", () => {
  it("renders at least three testimonials (FR-017)", () => {
    expect(TESTIMONIALS.length).toBeGreaterThanOrEqual(3);
  });

  it("names a specific improvement in each quote rather than generic praise (FR-017)", () => {
    // "Great app, highly recommend" is worth nothing to a visitor deciding whether the
    // scoring is real. Each quote has to point at something the grader actually does.
    const specifics =
      /grammar|vocabular|lexical|coherence|cohesion|task response|task achievement|band|criteri|structure|repetit/i;

    for (const t of TESTIMONIALS) {
      expect(t.quote, `"${t.name}" gives no specific improvement`).toMatch(specifics);
    }
  });

  it("holds General Training testimonials out of the rendered set (FR-018)", () => {
    // Stricter than the disabled-nav-link treatment on purpose: a testimonial
    // attributes a claim to a named person. Publishing one for a track the grader
    // cannot score asserts something untrue about a person, not just about a route.
    for (const t of TESTIMONIALS) {
      expect(t.track).not.toBe("General Training");
    }
  });

  it("keeps the suppressed entry in the source list so the decision is reversible", () => {
    // The design shipped a General Training testimonial. Deleting it would hide that
    // the decision was ever made; suppressing it at the boundary keeps the flip to a
    // one-line change when the product owner resolves the flagged question.
    expect(ALL_TESTIMONIALS.length).toBeGreaterThan(TESTIMONIALS.length);
    expect(ALL_TESTIMONIALS.some((t) => t.track === "General Training")).toBe(true);
  });

  it("attributes every rendered testimonial to a name and a track", () => {
    for (const t of TESTIMONIALS) {
      expect(t.name.trim()).not.toBe("");
      expect(t.track.trim()).not.toBe("");
    }
  });
});
