import Link from "next/link";

import type { PricingPlan } from "@/lib/pricing";

/**
 * One pricing plan (002 T014, FR-017).
 *
 * The recommended plan is marked with a visible text badge as well as a stronger
 * border. Colour or weight alone would be invisible to a screen-reader user and to
 * anyone with a colour-vision deficiency, and "exactly one plan is marked as
 * recommended" is an acceptance criterion, so it has to be perceivable, not just styled.
 */
export default function PricingCard({ plan }: { plan: PricingPlan }) {
  return (
    <div
      className={`flex flex-col rounded-lg border p-6 ${
        plan.recommended
          ? "border-2 border-primary bg-surface-container-low"
          : "border-outline-variant bg-surface-container-lowest"
      }`}
    >
      {plan.recommended && (
        <p className="mb-stack-sm w-fit rounded-sm bg-secondary-container px-2 py-1 text-label-caps uppercase text-on-secondary-container">
          Recommended
        </p>
      )}

      <h3 className="font-display text-headline-sm text-on-surface">{plan.name}</h3>

      <p className="mt-stack-sm flex items-baseline gap-1">
        <span className="font-display text-headline-md text-on-surface">{plan.price}</span>
        {plan.cadence && (
          <span className="font-body text-body-sm text-on-surface-variant">{plan.cadence}</span>
        )}
      </p>

      <ul className="mt-stack-md flex flex-1 flex-col gap-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-3 font-body text-body-sm text-on-surface-variant">
            <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 bg-primary" />
            {feature}
          </li>
        ))}
      </ul>

      <Link
        href="/signup"
        className={`mt-stack-md rounded px-4 py-2.5 text-center font-body text-body-md font-medium transition-colors ${
          plan.recommended
            ? "bg-primary text-on-primary hover:bg-primary-container"
            : "border border-primary text-primary hover:bg-primary/10"
        }`}
      >
        {plan.cta}
      </Link>
    </div>
  );
}
