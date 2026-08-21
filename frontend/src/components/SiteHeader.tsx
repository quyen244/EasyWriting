import Link from "next/link";

import DisabledLink from "@/components/ui/DisabledLink";
import { PRIMARY_NAV } from "@/lib/navigation";

/**
 * Persistent public navigation (Figma node 1001:603).
 *
 * Every nav destination comes from `lib/navigation.ts`, so an entry whose page does not
 * exist yet renders through `DisabledLink` rather than as a plausible-looking link into
 * nothing — the failure mode SC-005 exists to catch. The auth actions are deliberately
 * not in that list: they are buttons with their own emphasis, and US1 scenario 4 asks
 * for Login to be exactly as reachable as Join now.
 */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant/60 bg-surface/85 backdrop-blur">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-container flex-wrap items-center justify-between gap-4 px-margin-mobile py-5"
      >
        <Link href="/" className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded bg-primary-container font-body text-[20px] font-bold leading-none text-on-primary-container"
          >
            W
          </span>
          <span className="font-body text-[20px] font-bold tracking-[-0.5px] text-on-surface">
            WriteWise
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
          {PRIMARY_NAV.map((link) => (
            <DisabledLink
              key={link.label}
              {...link}
              className="font-body text-body-md font-medium text-on-surface-variant transition-colors hover:text-on-surface"
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/signin"
            className="font-body text-body-md font-medium text-on-surface-variant transition-colors hover:text-on-surface"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-primary-container px-6 py-2.5 font-body text-body-md font-medium text-on-primary-container shadow-hairline transition-transform hover:-translate-y-0.5"
          >
            Join now
          </Link>
        </div>
      </nav>
    </header>
  );
}
