import Link from "next/link";

import type { NavLink } from "@/lib/navigation";

/**
 * One "this doesn't exist yet" treatment, used everywhere (research.md R5).
 *
 * Spec.md asks for the same restraint in four separate places — the Speaking focus-area
 * card (FR-006), the General Training track links (FR-018), and the footer entries whose
 * pages have never been built (FR-019). Four ad hoc implementations would drift in how
 * "unavailable" gets signalled; one component cannot.
 *
 * An unavailable entry renders as a `<span>`, not a styled anchor: there is nothing to
 * navigate to, so there should be nothing to click, nothing in the tab order, and no
 * anchor for a screen reader to announce as a destination.
 */
export default function DisabledLink({
  label,
  href,
  available,
  className = "",
  comingSoonLabel = "Coming soon",
}: NavLink & { className?: string; comingSoonLabel?: string }) {
  // An `available` entry with no destination is a content mistake. Rendering it as a
  // live link would produce exactly the silent dead end SC-005 exists to forbid, so the
  // missing href decides rather than the flag.
  if (available && href) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <span
      aria-disabled="true"
      className={`inline-flex flex-wrap items-center gap-2 text-on-surface-variant ${className}`}
    >
      <span>{label}</span>
      <span className="rounded-sm bg-surface-container px-1.5 py-0.5 font-body text-[11px] font-semibold uppercase tracking-wide text-on-primary-fixed">
        {comingSoonLabel}
      </span>
    </span>
  );
}
