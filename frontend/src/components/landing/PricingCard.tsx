import Link from "next/link";

import { Dot, Star } from "@/components/ui/Sticker";
import { FUTURE_ENTITLEMENT_PATTERN, planHref, type PricingPlan } from "@/lib/pricing";

/**
 * One pricing plan — cloned from the reference's editorial pricing grid: hairline black
 * cards tilted a degree in alternating directions, with the Yearly plan lifted out as
 * the focal point (orange border, tinted ground, its badge floating above the card edge
 * rather than sitting inside it).
 *
 * Two details here are requirements rather than styling:
 *
 * 1. The recommended plan is marked with a visible text badge, not only a stronger
 *    border and a tilt. Colour and weight alone are invisible to a screen-reader user
 *    and to anyone with a colour-vision deficiency, and "exactly one plan is
 *    recommended" is an acceptance criterion (FR-013).
 * 2. Any feature line describing Speaking or "all future features" carries an explicit
 *    "not available yet" qualifier (FR-015). Speaking does not exist; the reference
 *    lists it beside features that do work, under the same green tick and with no
 *    qualifier at all, which reads as something the buyer gets on purchase.
 */

const BADGE_TONE: Record<NonNullable<PricingPlan["badgeTone"]>, string> = {
  yellow: "bg-[#facc15] text-on-surface",
  blue: "bg-secondary-container text-on-secondary-container",
  ink: "bg-secondary text-on-secondary",
  orange: "bg-primary-container text-on-primary-container",
};

/*
 * The alternating tilt that used to live here moved to the `RevealItem` wrapper in
 * `app/page.tsx`. Motion owns `transform` once a card animates in, so a Tailwind
 * `rotate-*` class on this element would simply be overwritten as the card lands —
 * the resting angle has to be the animation's target instead.
 */

export default function PricingCard({ plan, index = 0 }: { plan: PricingPlan; index?: number }) {
  const recommended = Boolean(plan.recommended);

  return (
    <div
      className={`relative flex h-full flex-col rounded-xl p-8 ${
        recommended
          ? "border-2 border-primary bg-surface-container-low shadow-card"
          : "border border-ink bg-surface-container-lowest shadow-hairline"
      }`}
    >
      {plan.badge &&
        (recommended ? (
          // The focal card wears its badge above the top edge, as the reference does.
          <span
            className={`absolute -top-5 left-1/2 w-max -translate-x-1/2 rounded px-6 py-2 font-body text-label-caps-lg uppercase ${BADGE_TONE[plan.badgeTone ?? "orange"]}`}
          >
            {plan.badge}
          </span>
        ) : (
          <span
            className={`mb-4 w-fit rounded px-3 py-1 font-body text-label-caps uppercase ${BADGE_TONE[plan.badgeTone ?? "ink"]}`}
          >
            {plan.badge}
          </span>
        ))}

      <h3
        className={`mb-2 font-display text-on-surface ${recommended ? "mt-4 text-title-lg" : "text-headline-sm"}`}
      >
        {plan.name}
      </h3>

      <p className="mb-2 flex items-baseline gap-1">
        <span
          className={`font-body font-bold text-on-surface ${recommended ? "text-[48px] leading-[48px]" : "text-stat"}`}
        >
          {plan.price}
        </span>
        {plan.cadence && (
          <span className="font-body text-body-lg text-on-surface-variant">{plan.cadence}</span>
        )}
      </p>

      {plan.savings && (
        <span className="mb-4 w-fit rounded bg-primary-container px-2 py-1 font-body text-[12px] font-bold text-on-primary-container">
          {plan.savings}
        </span>
      )}

      <p
        className={`mb-6 font-body text-on-surface-variant ${recommended ? "text-body-md font-medium" : "text-body-sm"}`}
      >
        {plan.tagline}
      </p>

      <ul className={`mb-8 flex flex-1 flex-col gap-3 ${recommended ? "" : "text-body-sm"}`}>
        {plan.features.map((feature, i) => {
          const future = plan.speakingIncluded && FUTURE_ENTITLEMENT_PATTERN.test(feature);
          return (
            <li
              key={feature}
              className={`flex flex-wrap items-center gap-2 font-body text-on-surface ${
                recommended && i === 0 ? "font-bold" : ""
              }`}
            >
              <span aria-hidden="true" className={recommended ? "text-tertiary" : "text-primary"}>
                {recommended ? "✓" : "•"}
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
            ? "block w-full rounded bg-primary-container px-6 py-4 text-center font-body text-body-xl font-bold text-on-primary-container shadow-hairline transition-transform hover:-translate-y-0.5"
            : "block w-full rounded border border-ink px-6 py-3 text-center font-body text-body-md font-bold text-on-surface transition-colors hover:bg-surface-container-low"
        }
      >
        {plan.cta}
      </Link>

      {recommended && <Star className="absolute -right-6 -top-8 size-10 text-[#facc15]" />}
      {index === 1 && <Dot className="absolute -bottom-4 -right-4 size-8 bg-secondary opacity-70" />}
    </div>
  );
}
