/**
 * Pricing plan content, transcribed from the `writewise` Figma design
 * (node 1001:370, "Pricing Section").
 *
 * ⚠️ The Yearly (`$49.9`) and Lifetime (`$149.9`) figures are copied exactly as the
 * design shows them and are **flagged for product-owner confirmation** (spec.md Edge
 * Cases, research.md R3). One tenth of a cent below a round number reads like a
 * truncated placeholder rather than a deliberate price.
 *
 * They are deliberately not "corrected" to `$49.99`/`$149.99` here. The previous
 * version of this file silently carried `$49.9` forward once already while disagreeing
 * with the design on Lifetime — guessing a second time would bury the uncertainty
 * instead of surfacing it. Confirm the real values before this ships.
 *
 * Display-only: checkout and plan enforcement belong to a future billing feature. Each
 * CTA carries the plan identity into `/signup` (FR-016) so the choice survives the hop,
 * which is the most a page with no backend can honestly do.
 */

export interface PricingPlan {
  name: "Free" | "Monthly" | "Yearly" | "Lifetime";
  price: string;
  /** Billing cadence suffix, e.g. "/mo". Absent for one-off and free plans. */
  cadence?: string;
  /** Display badge as designed. The Yearly plan wears its badge outside the card. */
  badge?: string;
  /** Which swatch the badge uses — matches the design's four distinct chip colours. */
  badgeTone?: "yellow" | "blue" | "ink" | "orange";
  /** One-line positioning under the price. */
  tagline: string;
  /** Small savings chip; only the Yearly plan has one in the design. */
  savings?: string;
  features: string[];
  cta: string;
  recommended?: boolean;
  /**
   * Drives FR-015's "forward-looking entitlement" treatment. A plan flagged here MUST
   * carry a feature line naming Speaking or all-future-features, so the card has
   * something to attach the "not usable yet" qualifier to — asserted in
   * `tests/unit/lib/pricing.test.ts`.
   */
  speakingIncluded: boolean;
}

/** Query key carrying the chosen plan into sign-up (FR-016). */
export const PLAN_QUERY_KEY = "plan";

export function planHref(plan: PricingPlan): string {
  return `/signup?${PLAN_QUERY_KEY}=${plan.name.toLowerCase()}`;
}

/** Feature lines that describe the not-yet-built Speaking capability (FR-015). */
export const FUTURE_ENTITLEMENT_PATTERN = /speaking|future features/i;

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    badge: "START HERE",
    badgeTone: "yellow",
    tagline: "For beginners trying IELTS",
    features: ["1 turn per day", "Basic AI scoring", "Task 1 & 2 support", "Limited feedback"],
    cta: "Get started",
    speakingIncluded: false,
  },
  {
    name: "Monthly",
    price: "$4.99",
    cadence: "/mo",
    badge: "POPULAR",
    badgeTone: "blue",
    tagline: "Flexible for quick prep",
    features: ["10 turns per day", "Full AI scoring", "Detailed feedback", "Email support"],
    cta: "Get started",
    speakingIncluded: false,
  },
  {
    name: "Yearly",
    price: "$49.9",
    cadence: "/year",
    badge: "RECOMMENDED",
    badgeTone: "orange",
    tagline: "Best value for achievers",
    savings: "Save 17%",
    features: [
      "Unlimited turns",
      "Everything in Monthly",
      "Speaking assessment",
      "Priority support",
    ],
    cta: "Get started",
    recommended: true,
    speakingIncluded: true,
  },
  {
    name: "Lifetime",
    price: "$149.9",
    badge: "PAY ONCE",
    badgeTone: "ink",
    tagline: "Pay once, use forever",
    features: ["Unlimited turns forever", "All future features", "VIP support"],
    cta: "Go Lifetime",
    speakingIncluded: true,
  },
];
