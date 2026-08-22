import { describe, expect, it } from "vitest";

import {
  APP_NAV,
  APP_NAV_LINKS,
  APP_ROUTES,
  FOOTER_COLUMNS,
  PRIMARY_NAV,
  activeNavId,
  type NavLink,
} from "@/lib/navigation";

/** T008 — data-model.md `NavLink`/`FooterLink`, spec.md FR-003, FR-018, FR-019, SC-005. */

const ALL_LINKS: NavLink[] = [
  ...PRIMARY_NAV,
  ...FOOTER_COLUMNS.flatMap((column) => column.links),
];

describe("navigation content", () => {
  it("gives every available entry a non-empty href", () => {
    for (const link of ALL_LINKS.filter((l) => l.available)) {
      expect(link.href, `"${link.label}" is available but has no destination`).toBeTruthy();
    }
  });

  it("points every available entry at a route this app actually serves (SC-005)", () => {
    // The link audit SC-005 asks for, executable instead of manual. Anything not in
    // APP_ROUTES is a dead end regardless of how plausible the path looks.
    for (const link of ALL_LINKS.filter((l) => l.available)) {
      const path = link.href!.split("#")[0] || "/";
      expect(APP_ROUTES, `"${link.label}" points at ${link.href}`).toContain(path);
    }
  });

  it("marks General Training as not yet supported (FR-018)", () => {
    // 001-ielts-score-assessment scopes General Training out — its Task 1 uses
    // different descriptors. Until the grader can score it, a live link here would
    // send a visitor toward something that cannot assess their writing.
    const gt = ALL_LINKS.filter((l) => /general training/i.test(l.label));
    expect(gt.length).toBeGreaterThan(0);
    for (const link of gt) {
      expect(link.available).toBe(false);
    }
  });

  it("marks Speaking as not yet available (FR-006)", () => {
    for (const link of ALL_LINKS.filter((l) => /speaking/i.test(l.label))) {
      expect(link.available).toBe(false);
    }
  });

  it("marks every stub destination unavailable rather than linking it (FR-019)", () => {
    const stubs = [
      "Blog",
      "Band Calculators",
      "About Us",
      "Contact",
      "Privacy Policy",
    ];

    for (const label of stubs) {
      const link = ALL_LINKS.find((l) => l.label === label);
      expect(link, `${label} is missing from the footer`).toBeDefined();
      expect(link!.available, `${label} must not render as a live link`).toBe(false);
    }
  });

  it("groups the footer into the three columns FR-022 names", () => {
    expect(FOOTER_COLUMNS.map((c) => c.title)).toEqual([
      "Product",
      "Resources",
      "Company",
    ]);
  });

  it("keeps at least one reachable destination in the primary nav (FR-003)", () => {
    expect(PRIMARY_NAV.some((l) => l.available)).toBe(true);
  });
});

/**
 * The same audit, applied to the authenticated product's sidebar.
 *
 * The sidebar makes a different judgement about Speaking than the marketing nav does,
 * and that difference is deliberate rather than an oversight: on the public site there
 * is nothing to sell, so Speaking is unlinked; inside the product the same destination
 * is a designed "in development" screen that tells a learner what is coming. Information
 * is not a dead end. What both must satisfy is that every live entry resolves to a route
 * the app actually serves.
 */
describe("authenticated navigation", () => {
  it("points every sidebar entry at a route this app serves", () => {
    for (const item of APP_NAV_LINKS) {
      if (!item.href) continue;
      const path = item.href.split("#")[0] || "/";
      expect(APP_ROUTES, `"${item.id}" points at ${item.href}`).toContain(path);
    }
  });

  it("gives every leaf entry a destination", () => {
    for (const item of APP_NAV_LINKS) {
      if (item.children) continue;
      expect(item.href, `"${item.id}" is a leaf with nowhere to go`).toBeTruthy();
    }
  });

  it("expands Practice and Mock Test rather than linking them directly", () => {
    // A group row that also navigated would make the chevron a lie: clicking the label
    // and clicking the chevron would do different things.
    for (const id of ["practice", "mock"]) {
      const group = APP_NAV.find((item) => item.id === id);
      expect(group?.children?.length, `${id} should be a group`).toBeGreaterThan(0);
      expect(group?.href, `${id} should not navigate`).toBeUndefined();
    }
  });

  it("resolves the deepest matching entry as the active one", () => {
    // A learner inside an exercise is still inside Practice → Writing; falling back to
    // no highlight would leave them with no sense of where they are.
    expect(activeNavId("/practice/writing/t2_essay_outline")).toBe("practice-writing");
    expect(activeNavId("/practice/writing")).toBe("practice-writing");
    expect(activeNavId("/mock-test/writing")).toBe("mock-writing");
    expect(activeNavId("/workspace")).toBe("grader");
  });

  it("does not highlight the sidebar for routes outside the product", () => {
    expect(activeNavId("/signin")).toBeNull();
  });
});
