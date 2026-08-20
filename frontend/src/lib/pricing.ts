/**
 * Pricing plan content (002 T014, FR-017, research.md decision 7).
 *
 * These numbers deliberately differ from the `marketing_landing_page_fresh_refresh`
 * mockup, which shipped placeholders ($19/mo, 2 essays/month free, $149 lifetime). The
 * spec corrected them at spec time rather than deferring, because publishing incorrect
 * prices to real visitors is a trust problem, not a cosmetic one.
 *
 * Display-only: checkout, payment processing and plan enforcement are explicitly out of
 * scope for this feature, so every CTA routes to `/signup` like the primary CTA does.
 */

export interface PricingPlan {
  name: "Free" | "Monthly" | "Yearly" | "Lifetime";
  price: string;
  /** Billing cadence suffix, e.g. "/mo". Absent for one-off and free plans. */
  cadence?: string;
  features: string[];
  cta: string;
  recommended?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    features: ["1 essay per day", "Full band score across all four criteria"],
    cta: "Start free",
  },
  {
    name: "Monthly",
    price: "$4.99",
    cadence: "/mo",
    features: ["Unlimited essays", "Full criterion explanations and evidence"],
    cta: "Go monthly",
  },
  {
    name: "Yearly",
    price: "$49.9",
    cadence: "/yr",
    features: ["Everything in Monthly", "Two months free versus monthly billing"],
    cta: "Go yearly",
    recommended: true,
  },
  {
    name: "Lifetime",
    price: "$99",
    features: ["Pay once, access forever", "All future updates included"],
    cta: "Get lifetime",
  },
];
