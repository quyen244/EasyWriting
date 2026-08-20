import Link from "next/link";

/** Closing call to action (002 T015). */
export default function FinalCta() {
  return (
    <section className="border-y border-outline-variant bg-surface-container-low">
      <div className="mx-auto max-w-container px-margin-mobile py-stack-lg text-center md:px-margin-desktop">
        <h2 className="font-display text-headline-md text-on-surface">
          Ready to find out where your band actually is?
        </h2>
        <p className="mx-auto mt-stack-sm max-w-xl font-body text-body-md text-on-surface-variant">
          Score one essay a day for free, against all four criteria, with the reasoning
          quoted from your own writing.
        </p>
        <Link
          href="/signup"
          className="mt-stack-md inline-block rounded bg-primary px-6 py-3 font-body text-body-md font-medium text-on-primary transition-colors hover:bg-primary-container"
        >
          Score my essay — free
        </Link>
      </div>
    </section>
  );
}
