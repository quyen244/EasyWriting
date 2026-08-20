import Link from "next/link";

/**
 * Shared public navigation (002 T018, T043).
 *
 * Carries the FAQ link FR-013 requires to be reachable from the main navigation, and
 * keeps sign-in as visually findable as sign-up (US1 scenario 5 — a returning visitor
 * must not have to hunt for it).
 */
export default function SiteHeader() {
  return (
    <header className="border-b border-outline-variant">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-container flex-wrap items-center justify-between gap-4 px-margin-mobile py-4 md:px-margin-desktop"
      >
        <Link href="/" className="font-display text-headline-sm text-on-surface">
          WriteWise
        </Link>

        <div className="flex flex-wrap items-center gap-2 md:gap-6">
          <Link
            href="/#how-it-works"
            className="font-body text-body-sm text-on-surface-variant hover:text-on-surface"
          >
            How it works
          </Link>
          <Link
            href="/#pricing"
            className="font-body text-body-sm text-on-surface-variant hover:text-on-surface"
          >
            Pricing
          </Link>
          <Link
            href="/faq"
            className="font-body text-body-sm text-on-surface-variant hover:text-on-surface"
          >
            FAQ
          </Link>
          <Link
            href="/signin"
            className="rounded border border-primary px-4 py-2 font-body text-body-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded bg-primary px-4 py-2 font-body text-body-sm font-medium text-on-primary transition-colors hover:bg-primary-container"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
