import Link from "next/link";

import ScoringDemo from "@/components/landing/ScoringDemo";
import CountUp from "@/components/motion/CountUp";
import { MaskLine, MaskLines } from "@/components/motion/MaskLine";
import Highlighter from "@/components/motion/Highlighter";
import Reveal from "@/components/motion/Reveal";
import { GlobeIcon, LockIcon, MicIcon, PencilIcon } from "@/components/ui/Icon";
import { Star } from "@/components/ui/Sticker";

/**
 * The hero.
 *
 * Left column carries the pitch, right column carries a looping depiction of the grader
 * working. The demo bleeds past the container's right edge at `xl` so it reads as an
 * object pasted onto the page rather than a card parked in the second column.
 *
 * Two content notes, both deliberate:
 *
 *  - The brief specified emoji for the two calls to action and the three proof points
 *    (pencil, headphones, star, padlock, globe). They render as a different glyph on
 *    every platform and in a colour that fights the palette, so each is the matching
 *    inline SVG from `ui/Icon` instead. The labels are unchanged.
 *  - "Grade Speaking" is not a link. Speaking does not exist yet, and this build's rule
 *    is that nothing unbuilt gets a live destination — the same treatment
 *    `FocusAreaSelector` already gives it.
 */

const STATS = [
  { figure: "500K+", label: "Essays graded" },
  { figure: "95%+", label: "Accuracy rate" },
  { figure: "+1.5", label: "Band score improved" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-10 lg:pb-28 lg:pt-16">
      <span
        aria-hidden="true"
        data-decoration
        className="dot-grid absolute inset-0 -z-10"
      />

      <div className="mx-auto grid max-w-container items-center gap-x-12 gap-y-16 px-margin-mobile lg:grid-cols-12">
        <div className="relative lg:col-span-7">
          <Star className="absolute -left-7 -top-8 hidden size-10 text-[#facc15] lg:block" />

          <Reveal variant="cut" className="mb-7 flex items-center gap-3">
            <span aria-hidden="true" className="block h-[2px] w-10 bg-primary-container" />
            <p className="font-body text-eyebrow uppercase text-on-surface-variant">
              International standard IELTS grading
            </p>
          </Reveal>

          <h1 className="font-display text-display-hero text-on-surface">
            <MaskLines delayChildren={0.12}>
              {/*
                The trailing space is load-bearing. Each masked line is its own block,
                so without it the heading's text content — and therefore its accessible
                name — reads "Grade IELTSfree".
              */}
              <MaskLine>{"Grade IELTS "}</MaskLine>
              <MaskLine>
                <Highlighter delay={0.72}>
                  <em className="italic">free</em>
                </Highlighter>
              </MaskLine>
            </MaskLines>
          </h1>

          <Reveal variant="rise" delay={0.5} className="mt-8">
            <p className="max-w-[46ch] text-pretty font-body text-body-lg text-on-surface-variant">
              Writing &amp; Speaking — graded on the{" "}
              <strong className="font-semibold text-on-surface">
                4 official IELTS criteria
              </strong>
              . Trusted by 100,000+ students.
            </p>
          </Reveal>

          <Reveal variant="rise" delay={0.62} className="mt-9">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2.5 rounded-md bg-primary-container px-7 py-4 font-body text-body-lg font-bold text-on-primary-container shadow-brutal-sm transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <PencilIcon className="size-5" />
                Grade Writing
              </Link>

              <span
                aria-disabled="true"
                className="inline-flex cursor-not-allowed items-center gap-2.5 rounded-md border-2 border-outline-variant px-7 py-4 font-body text-body-lg font-bold text-on-surface-variant"
              >
                <MicIcon className="size-5" />
                Grade Speaking
                <span className="rounded-sm bg-surface-container px-1.5 py-0.5 font-body text-[11px] font-semibold uppercase tracking-wide text-on-primary-fixed">
                  Coming soon
                </span>
              </span>
            </div>

            <Link
              href="/#how-it-works"
              className="mt-5 inline-flex items-center gap-1.5 font-body text-body-md font-semibold text-on-surface-variant underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              How it works
              <span aria-hidden="true">↓</span>
            </Link>
          </Reveal>

          <Reveal variant="rise" delay={0.74} className="mt-12">
            <dl className="grid max-w-lg grid-cols-3 divide-x divide-outline-variant border-y border-outline-variant">
              {STATS.map((stat) => (
                <div key={stat.label} className="px-4 py-5 first:pl-0">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <CountUp
                      value={stat.figure}
                      className="block font-display text-[34px] font-bold leading-none tabular-nums text-on-surface"
                    />
                    <span className="mt-2 block font-body text-mono-caps uppercase text-on-surface-variant">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal variant="fade" delay={0.9} className="mt-7">
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-3 font-body text-body-sm text-on-surface-variant">
              <li className="flex items-center gap-2">
                <Star className="size-4 text-accent-yellow" />
                <span className="font-bold text-on-surface">4.9/5</span>
                <span>8,847 reviews</span>
              </li>
              <li className="flex items-center gap-2">
                <LockIcon className="size-4" />
                Absolute security
              </li>
              <li className="flex items-center gap-2">
                <GlobeIcon className="size-4" />
                International standard
              </li>
            </ul>
          </Reveal>
        </div>

        <div className="lg:col-span-5 xl:-mr-10">
          <ScoringDemo />
        </div>
      </div>
    </section>
  );
}
