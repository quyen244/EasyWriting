/**
 * Navigation content for the persistent header and footer (002 T009, data-model.md).
 *
 * Every entry carries `available`, so "coming soon" is one code path (`DisabledLink`,
 * research.md R5) rather than a judgement made separately in each section.
 *
 * On General Training: the `writewise` design links it from both the nav and the footer,
 * but 001-ielts-score-assessment scopes it out — General Training Task 1 uses different
 * band descriptors and the grader cannot score it. Per spec.md's flagged decision and
 * the product owner's confirmation (2026-08-21, "không cần GT"), those entries stay in
 * the content — marked unavailable — rather than being deleted. Deleting them would
 * erase the fact that the question was ever asked; suppressing them keeps the answer
 * visible and the reversal cheap.
 */

export interface NavLink {
  label: string;
  /** Absent when the destination does not exist yet. */
  href?: string;
  available: boolean;
}

export interface FooterColumn {
  title: "Product" | "Resources" | "Company";
  links: NavLink[];
}

/**
 * Every route this app actually serves. The navigation unit test audits `href`s against
 * this list, which turns SC-005's "zero silent dead ends" from a manual pass someone has
 * to remember into something that fails the build.
 */
export const APP_ROUTES = [
  "/",
  "/faq",
  "/signin",
  "/signup",
  "/workspace",
  "/profile",
] as const;

/** Where the Writing/Academic experience lives — 001's grader entry point. */
export const GRADER_HREF = "/workspace";

export const PRIMARY_NAV: NavLink[] = [
  { label: "Academic", href: GRADER_HREF, available: true },
  { label: "General Training", available: false },
  { label: "Pricing", href: "/#pricing", available: true },
  // The design's "Resources" nav item is realised as the FAQ link: it is the only
  // resource page that exists, and a live link to a real page beats a disabled label.
  { label: "FAQ", href: "/faq", available: true },
];

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Academic Writing", href: GRADER_HREF, available: true },
      { label: "General Training", available: false },
      { label: "Speaking", available: false },
      { label: "Pricing", href: "/#pricing", available: true },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "FAQ", href: "/faq", available: true },
      { label: "Blog", available: false },
      { label: "Practice Tests", available: false },
      { label: "Band Calculators", available: false },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", available: false },
      { label: "Contact", available: false },
      { label: "Privacy Policy", available: false },
    ],
  },
];
