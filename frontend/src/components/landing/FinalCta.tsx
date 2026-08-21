import Link from "next/link";

import { SketchArrow } from "@/components/ui/Icon";
import { Dot, Star } from "@/components/ui/Sticker";

/**
 * The closing call to action — cloned from the reference's Bold CTA section.
 *
 * A full-bleed orange-to-yellow band under a soft radial wash, with the reference's
 * asymmetric button (`4px 20px` corners, orange offset shadow) and the translucent black
 * bar sitting behind the italic line.
 *
 * The pull-quote card is illustrative copy, not a collected review — see
 * `lib/testimonials.ts` for why that distinction stays explicit rather than being
 * quietly transcribed. The reference's "— Verified Student" attribution is replaced for
 * the same reason: nothing here has been verified.
 */
export default function FinalCta() {
  return (
    <section className="relative overflow-hidden border-y-2 border-ink bg-gradient-to-r from-primary-container to-[#facc15] py-32">
      <span
        aria-hidden="true"
        data-decoration
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 70% 30%, #F0F9FF 0%, #FFF7ED 30%, #FFFBEB 60%, #FDFBF7 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-container px-margin-mobile">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start">
          <div className="relative w-full text-left lg:w-2/3">
            <span
              data-tilt
              data-decoration
              className="absolute -left-4 -top-12 hidden -rotate-12 rounded-lg border-2 border-ink bg-surface-container-lowest p-3 shadow-brutal-sm lg:block"
            >
              <span className="font-accent text-marker font-bold text-on-surface">
                6.5 <span className="text-tertiary">→ 7.5</span>
              </span>
            </span>

            <h2 className="mb-6 font-display text-display-xl-mobile tracking-tight text-on-primary-container md:text-display-xl">
              Ready to turn your next essay into a{" "}
              <span className="relative inline-block">
                <em className="relative z-10 italic text-on-primary-container">
                  higher band score?
                </em>
                <span
                  aria-hidden="true"
                  data-decoration
                  data-tilt
                  className="absolute bottom-2 left-0 -z-10 h-6 w-full -rotate-1 bg-black/20"
                />
              </span>
            </h2>

            <div className="relative inline-block">
              <Link
                href="/signup"
                className="inline-block border-2 border-ink bg-inverse-surface px-12 py-6 font-body text-headline-sm font-black uppercase tracking-tighter text-inverse-on-surface shadow-brutal-accent transition-transform hover:scale-105"
                style={{ borderRadius: "4px 20px" }}
              >
                Start Scoring for Free
              </Link>
              <SketchArrow className="absolute -right-24 -top-8 hidden size-20 -rotate-12 text-primary lg:block" />
            </div>
          </div>

          <div className="relative flex w-full justify-center lg:w-1/3 lg:justify-end">
            <div className="relative">
              <Star className="absolute -right-10 -top-10 size-16 rotate-12 text-[#facc15]" />
              <Dot className="absolute -left-12 bottom-0 size-12 bg-secondary opacity-60" />

              <figure
                data-tilt
                className="rotate-3 rounded-xl border-2 border-ink bg-surface-container-lowest p-6 shadow-brutal"
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
        </div>
      </div>
    </section>
  );
}
