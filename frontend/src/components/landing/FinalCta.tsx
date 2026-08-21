import Link from "next/link";

import { Dot, Star } from "@/components/ui/Sticker";

/**
 * The closing call to action (Figma node 1001:518).
 *
 * A full-bleed orange-to-yellow band with the design's hard black borders and offset
 * shadows. The pull-quote card beside it is illustrative copy, not a collected review —
 * see `lib/testimonials.ts` for why that distinction is kept explicit rather than
 * quietly transcribed from the design file.
 */
export default function FinalCta() {
  return (
    <section className="relative overflow-hidden border-y-2 border-ink bg-gradient-to-r from-primary-container to-accent-yellow-soft py-24">
      <div className="mx-auto grid max-w-container gap-16 px-margin-mobile lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-center">
        <div className="relative">
          <span
            data-tilt
            data-decoration
            className="absolute -top-16 left-0 hidden -rotate-12 rounded-lg border-2 border-ink bg-surface-container-lowest px-4 py-3 font-accent text-marker text-on-surface shadow-brutal-sm lg:block"
          >
            6.5 <span className="text-tertiary">→ 7.5</span>
          </span>

          <h2 className="font-display text-display-xl-mobile text-on-primary-container md:text-display-xl">
            Ready to turn your next essay into a{" "}
            <em className="italic">higher band score?</em>
          </h2>

          <Link
            href="/signup"
            className="mt-10 inline-block rounded-[4px_20px_4px_20px] border-2 border-ink bg-inverse-surface px-12 py-6 font-body text-headline-sm font-black uppercase tracking-[-1.2px] text-inverse-on-surface shadow-brutal-accent transition-transform hover:-translate-y-1"
          >
            Start scoring for free
          </Link>
        </div>

        <div className="relative hidden lg:block">
          <Star className="absolute -right-6 -top-10 size-16 rotate-12 text-[#facc15]" />
          <Dot className="absolute -left-10 bottom-2 size-12 bg-secondary opacity-60" />
          <figure
            data-tilt
            className="rotate-3 rounded-xl border-2 border-ink bg-surface-container-lowest p-7 shadow-brutal"
          >
            <blockquote className="font-body text-body-lg font-bold italic text-on-surface">
              &ldquo;The best investment I made for my IELTS prep.&rdquo;
            </blockquote>
            <figcaption className="mt-2 font-body text-body-sm text-on-surface-variant">
              — Illustrative example, not a collected review
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
