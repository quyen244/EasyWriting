export interface NavLink {
  label: string;
  /** Absent when the destination does not exist yet. */
  href?: string;
  available: boolean;
}

/** A header dropdown: one product area, three task-level entries beneath it. */
export interface NavMenu {
  label: string;
  items: NavLink[];
}

export interface FooterColumn {
  title: "Product" | "Resources" | "Company";
  links: NavLink[];
}

export const APP_ROUTES = [
  "/",
  "/faq",
  "/signin",
  "/signup",
  "/workspace",
  "/profile",
] as const;

/** Where the Writing experience lives — 001's grader entry point. */
export const GRADER_HREF = "/workspace";

/**
 * The three product menus.
 *
 * Only Writing Task 1 and Task 2 resolve: they are the two things 001's grader can
 * actually score, and both land on the same workspace because it handles either task.
 * Everything else — Speaking, and the whole Mock Test and Practice areas — is marked
 * unavailable and renders through `DisabledLink` as a non-clickable "Coming soon" row.
 *
 * Keeping the unbuilt entries visible rather than deleting them is the point: the menu
 * shows the shape of the product without pretending any of it is ready. A live link to
 * an unbuilt route is the silent dead end SC-005 forbids.
 *
 * Both Writing hrefs are bare `/workspace`, not `/workspace?task=1`. The SC-005 audit
 * splits an href on `#` only, so a query string reads as a route the app does not serve
 * and fails the build.
 */
export const NAV_MENUS: NavMenu[] = [
  {
    label: "Grader",
    items: [
      { label: "IELTS Writing Task 1", href: GRADER_HREF, available: true },
      { label: "IELTS Writing Task 2", href: GRADER_HREF, available: true },
      { label: "IELTS Speaking", available: false },
    ],
  },
  {
    label: "Mock Test",
    items: [
      { label: "Mock IELTS Writing Task 1", available: false },
      { label: "Mock IELTS Writing Task 2", available: false },
      { label: "Mock IELTS Speaking", available: false },
    ],
  },
  {
    label: "Practice",
    items: [
      { label: "Practice IELTS Writing Task 1", available: false },
      { label: "Practice IELTS Writing Task 2", available: false },
      { label: "Practice IELTS Speaking", available: false },
    ],
  },
];

/**
 * Flat header links, shown beside the menus.
 *
 * FAQ is here even though it is not a product area: `/faq` is a real route, and leaving
 * it out of the header orphans the page behind a single footer link.
 */
export const NAV_LINKS: NavLink[] = [
  { label: "Pricing", href: "/#pricing", available: true },
  { label: "FAQ", href: "/faq", available: true },
];

/**
 * Every primary-nav destination as one flat list.
 *
 * This is what the SC-005 link audit walks. Derived rather than hand-maintained so a
 * menu entry cannot be added without the audit seeing it.
 */
export const PRIMARY_NAV: NavLink[] = [
  ...NAV_MENUS.flatMap((menu) => menu.items),
  ...NAV_LINKS,
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
