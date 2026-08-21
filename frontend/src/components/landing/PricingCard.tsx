import Link from "next/link";

import {
  FUTURE_ENTITLEMENT_PATTERN,
  planHref,
  type PricingPlan,
} from "@/lib/pricing";

/**
 * One pricing plan (Figma node 1001:370).
 *
 * Two things here are requirements rather than styling choices:
 *
 * 1. The recommended plan is marked with a visible text badge, not only a stronger
 *    border and a tilt. Colour and weight alone are invisible to a screen-reader user
 *    and to anyone with a colour-vision deficiency, and "exactly one plan is
 *    recommended" is an acceptance criterion (FR-013).
 * 2. Any feature line describing Speaking or "all future features" gets an explicit
 *    "not available yet" qualifier rendered next to it (FR-015). Speaking does not
 *    exist; listing it unqualified beside features that do work would read as a
 *    capability the buyer gets on purchase.
 */

const BADGE_TONE: Record<NonNullable<PricingPlan["badgeTone"]>, string> = {
  yellow: "bg-accent-yellow-soft text-on-surface border border-outline-variant",
  blue: "bg-secondary-container text-on-secondary-container",
  ink: "bg-secondary text-on-secondary",
  orange: "bg-primary-container text-on-primary-container",
};

export default function PricingCard({ plan }: { plan: PricingPlan }) {
  const recommended = Boolean(plan.recommended);

  return (
    <div
      data-tilt
      className={
        recommended
          ? "relative rounded-xl border-2 border-primary bg-surface-container-low p-9 shadow-card"
          : "relative rounded-xl border border-ink bg-surface-container-lowest p-8 shadow-hairline"
      }
    >
      {plan.badge && (
        <p
          className={`mb-4 w-fit rounded px-3 py-1 font-body text-label-caps uppercase ${
            BADGE_TONE[plan.badgeTone ?? "ink"]
          }`}
        >
          {plan.badge}
        </p>
      )}

      <h3
        className={
          recommended
            ? "font-display text-title-lg text-on-surface"
            : "font-display text-headline-sm text-on-surface"
        }
      >
        {plan.name}
      </h3>

      <p className="mt-2 flex items-baseline gap-1">
        <span
          className={`font-body font-bold text-on-surface ${
            recommended ? "text-[48px] leading-[48px]" : "text-stat"
          }`}
        >
          {plan.price}
        </span>
        {plan.cadence && (
          <span className="font-body text-body-lg text-on-surface-variant">{plan.cadence}</span>
        )}
      </p>

      {plan.savings && (
        <p className="mt-3 w-fit rounded bg-primary-container px-2 py-1 font-body text-[12px] font-bold text-on-primary-container">
          {plan.savings}
        </p>
      )}

      <p className="mt-4 font-body text-body-sm text-on-surface-variant">{plan.tagline}</p>

      <ul className="mt-6 flex flex-col gap-3">
        {plan.features.map((feature) => {
          const future = plan.speakingIncluded && FUTURE_ENTITLEMENT_PATTERN.test(feature);
          return (
            <li
              key={feature}
              className="flex flex-wrap items-center gap-2 font-body text-body-sm text-on-surface"
            >
              <span aria-hidden="true" className="text-primary">
                •
              </span>
              {feature}
              {future && (
                <span className="rounded-sm bg-surface-container px-1.5 py-0.5 font-body text-[11px] font-semibold uppercase tracking-wide text-on-primary-fixed">
                  Not available yet
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <Link
        href={planHref(plan)}
        className={
          recommended
            ? "mt-8 block rounded px-6 py-4 text-center font-body text-body-xl font-bold bg-primary-container text-on-primary-container shadow-hairline transition-transform hover:-translate-y-0.5"
            : "mt-8 block rounded border border-ink px-6 py-3 text-center font-body text-body-md font-bold text-on-surface transition-colors hover:bg-surface-container-low"
        }
      >
        {plan.cta}
      </Link>
    </div>
  );
}
