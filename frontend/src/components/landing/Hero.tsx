import Link from "next/link";

import { ArrowRightIcon } from "@/components/ui/Icon";
import { Blob, Dot, Star } from "@/components/ui/Sticker";

/**
 * Landing hero (Figma node 1001:3).
 *
 * The headline is one sentence broken across five display lines, with the last two set
 * in Playfair's italic — that italic run is the design's whole typographic idea, so it
 * is real markup (`<em>`) rather than a styled span: it reads as emphasis to a screen
 * reader too, which is what it actually is.
 *
 * The right-hand column in the design holds only decoration (two blurred colour blobs
 * and a dot). It carries no content, so it is `aria-hidden` furniture here rather than
 * an empty grid cell that assistive tech has to step through.
 */
export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-container gap-16 px-margin-mobile pb-16 pt-12 lg:grid-cols-2 lg:items-center">
        <div className="relative">
          <Star className="absolute -left-6 -top-10 hidden size-12 text-[#facc15] opacity-90 lg:block" />

          {/*
            The design breaks this headline deliberately: "Master your / IELTS Writing /
            with / AI-powered / feedback". The width below reproduces those breaks at the
            design's 72px size, and `AI-powered` is kept unbreakable so the browser never
            splits it at the hyphen — which is the one wrap that looks like a bug rather
            than a typographic choice.
          */}
          <h1 className="max-w-[9ch] font-display text-display-xl-mobile text-on-surface md:max-w-[520px] md:text-display-xl">
            Master your IELTS Writing with{" "}
            <em className="whitespace-nowrap italic">AI-powered</em>{" "}
            <em className="italic">feedback</em>
          </h1>

          <p className="mt-8 max-w-[512px] font-body text-body-lg text-on-surface-variant">
            Get instant, examiner-grade evaluations and personalized tips to boost your band
            score. When and where you need it most.
          </p>

          <div className="mt-12 flex flex-wrap items-stretch gap-4">
            <Link
              href="/signup"
              className="rounded-md bg-primary-container px-8 py-3.5 font-body text-body-lg font-semibold text-on-primary-container shadow-card transition-transform hover:-translate-y-0.5"
            >
              Get started for free
            </Link>
            <Link
              href="/#how-it-works"
              className="rounded-md border border-outline-variant bg-surface-container-lowest px-8 py-3.5 font-body text-body-lg font-semibold text-on-surface shadow-hairline transition-transform hover:-translate-y-0.5"
            >
              How it works
            </Link>
          </div>

          <p className="mt-12 flex flex-wrap items-center gap-2 font-body text-body-lg text-on-surface">
            <span
              data-tilt
              className="-rotate-2 rounded-sm bg-secondary px-2 py-1 text-body-sm font-bold text-on-secondary"
            >
              Trusted
            </span>
            <em className="font-display italic">by students worldwide</em>
            <ArrowRightIcon className="size-6 text-on-surface" />
          </p>
        </div>

        <div aria-hidden="true" className="relative hidden h-[420px] lg:block">
          <Blob className="-right-10 top-0 size-96 bg-accent-yellow-soft opacity-100 mix-blend-multiply" />
          <Blob className="bottom-0 left-4 size-96 bg-secondary-container opacity-90 mix-blend-multiply" />
          <Dot className="absolute right-8 top-40 size-4 bg-secondary" />
        </div>
      </div>
    </section>
  );
}
