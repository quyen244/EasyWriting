import type { MessageKey } from "@/lib/i18n";

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
  "/account",
  "/practice/writing",
  "/practice/speaking",
  "/mock-test/writing",
  "/mock-test/speaking",
] as const;

/** Where the Writing experience lives — 001's grader entry point. */
export const GRADER_HREF = "/workspace";

/**
 * The three product menus on the marketing header.
 *
 * Writing now resolves everywhere: the grader, practice and the mock test are all built.
 * Speaking is still marked unavailable in *this* nav, which is a different judgement from
 * the one the app sidebar makes. Here we are selling; there is nothing to sell yet, so a
 * live link would be a promise the product cannot keep. Inside the product the same
 * destinations are live, because there they lead to a designed "in development" screen
 * that tells a paying learner what is coming — which is information, not a dead end.
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
      { label: "Mock IELTS Writing", href: "/mock-test/writing", available: true },
      { label: "Mock IELTS Speaking", available: false },
    ],
  },
  {
    label: "Practice",
    items: [
      { label: "Practice IELTS Writing", href: "/practice/writing", available: true },
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
      { label: "Practice Tests", href: "/mock-test/writing", available: true },
      { label: "Blog", available: false },
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

// ── Authenticated product navigation ──────────────────────────────────────────

export type AppNavIcon =
  | "home"
  | "grader"
  | "practice"
  | "mock"
  | "support"
  | "account"
  | "writing"
  | "speaking";

/**
 * One sidebar entry.
 *
 * Labels are message keys, not strings: the sidebar is interface text and has to exist
 * in both locales. A `label: string` here would be an English string compiled into a
 * data module, which is exactly the thing the catalogue exists to prevent.
 */
export interface AppNavItem {
  /** Stable identity, used for the expanded/collapsed state and as a React key. */
  id: string;
  labelKey: MessageKey;
  href?: string;
  icon: AppNavIcon;
  available: boolean;
  /** Present on a group. A group's own row expands rather than navigates. */
  children?: AppNavItem[];
  /** True when the destination leaves the authenticated product. */
  external?: boolean;
}

export const APP_NAV: AppNavItem[] = [
  // Home is the public landing page, not a dashboard: the brief maps it there, and the
  // learner's actual dashboard is Account.
  { id: "home", labelKey: "nav.home", href: "/", icon: "home", available: true, external: true },
  { id: "grader", labelKey: "nav.grader", href: "/workspace", icon: "grader", available: true },
  {
    id: "practice",
    labelKey: "nav.practice",
    icon: "practice",
    available: true,
    children: [
      { id: "practice-writing", labelKey: "nav.writing", href: "/practice/writing", icon: "writing", available: true },
      { id: "practice-speaking", labelKey: "nav.speaking", href: "/practice/speaking", icon: "speaking", available: true },
    ],
  },
  {
    id: "mock",
    labelKey: "nav.mockTest",
    icon: "mock",
    available: true,
    children: [
      { id: "mock-writing", labelKey: "nav.writing", href: "/mock-test/writing", icon: "writing", available: true },
      { id: "mock-speaking", labelKey: "nav.speaking", href: "/mock-test/speaking", icon: "speaking", available: true },
    ],
  },
  // Support has no page of its own; the FAQ is the support content, and a second page
  // repeating it would be a worse answer than the one that already exists.
  { id: "support", labelKey: "nav.support", href: "/faq", icon: "support", available: true, external: true },
];

/** Every sidebar destination, flattened — the same audit the marketing nav gets. */
export const APP_NAV_LINKS: AppNavItem[] = APP_NAV.flatMap((item) => [
  item,
  ...(item.children ?? []),
]).filter((item) => item.href !== undefined || !item.children);

/**
 * Which sidebar entry a path belongs to.
 *
 * Longest match wins, so `/practice/writing/t2_essay_outline` highlights Practice →
 * Writing rather than falling back to nothing.
 */
export function activeNavId(pathname: string): string | null {
  const candidates = APP_NAV_LINKS.filter(
    (item) => item.href && !item.external && pathname.startsWith(item.href),
  );
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => (b.href?.length ?? 0) - (a.href?.length ?? 0))[0].id;
}
