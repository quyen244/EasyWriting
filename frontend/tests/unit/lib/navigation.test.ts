import { describe, expect, it } from "vitest";

import {
  APP_ROUTES,
  FOOTER_COLUMNS,
  PRIMARY_NAV,
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
      "Practice Tests",
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
