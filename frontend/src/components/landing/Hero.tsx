import Link from "next/link";

/**
 * Landing hero (002 T010, FR-001).
 *
 * The headline states the product's job rather than a slogan, because US1 scenario 1
 * requires a visitor to be able to state the purpose after reading this alone.
 */
export default function Hero() {
  return (
    <section className="mx-auto max-w-container px-margin-mobile py-stack-lg md:px-margin-desktop md:py-24">
      <div className="max-w-3xl">
        <p className="text-label-caps uppercase text-secondary">IELTS Writing · Task 1 &amp; Task 2</p>
        <h1 className="mt-stack-sm font-display text-display-lg-mobile text-on-surface md:text-display-lg">
          Know exactly why your IELTS essay scored what it did.
        </h1>
        <p className="mt-stack-md max-w-2xl font-body text-body-lg text-on-surface-variant">
          Get a band score across all four official assessment criteria, each one explained and
          anchored to quotes from your own writing — in under 60 seconds.
        </p>

        <div className="mt-stack-lg flex flex-wrap items-center gap-4">
          <Link
            href="/signup"
            className="rounded bg-primary px-6 py-3 font-body text-body-md font-medium text-on-primary transition-colors hover:bg-primary-container"
          >
            Score my essay — free
          </Link>
          <Link
            href="/faq"
            className="rounded border border-primary px-6 py-3 font-body text-body-md font-medium text-primary transition-colors hover:bg-primary/10"
          >
            How the scoring works
          </Link>
        </div>

        <p className="mt-stack-md font-body text-body-sm text-on-surface-variant">
          No card required. The free plan scores one essay a day, in full.
        </p>
      </div>
    </section>
  );
}
