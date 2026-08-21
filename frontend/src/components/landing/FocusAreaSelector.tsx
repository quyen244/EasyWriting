import Link from "next/link";

import { Marker } from "@/components/ui/Sticker";
import { GRADER_HREF } from "@/lib/navigation";

/**
 * "Choose your focus area" (Figma node 1001:34).
 *
 * The two cards look symmetrical by design, which is exactly the risk FR-006 names: a
 * visitor must not read Speaking as an equally-available option. Three things separate
 * them, and none is colour alone — Writing is a real link and Speaking is not an
 * anchor at all, Speaking's marker says "Coming soon" in text, and that card announces
 * itself through `aria-disabled` rather than relying on the blue tint.
 *
 * The organic corner radii are the design's signature shape (`rounded-blob`), not an
 * arbitrary rounding.
 */
export default function FocusAreaSelector() {
  return (
    <section id="focus-area" className="mx-auto max-w-container px-margin-mobile py-section-y">
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="font-display text-display-lg-mobile text-on-surface md:text-display-lg">
          Choose your <em className="italic">focus area</em>
        </h2>
        <p className="max-w-prose font-body text-body-lg text-on-surface-variant">
          Select the skill you want to improve today with targeted AI feedback.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-4xl gap-12 md:grid-cols-2">
        {/* Writing — available today */}
        <div className="relative">
          <span
            aria-hidden="true"
            data-decoration
            data-tilt
            className="absolute -inset-5 -rotate-3 rounded-blob bg-accent-peach opacity-70"
          />
          <Link
            href={GRADER_HREF}
            className="relative flex h-full min-h-[340px] flex-col items-center justify-center gap-3 rounded-blob border-2 border-surface-dim bg-surface-container-lowest px-10 py-10 text-center shadow-card transition-transform hover:-translate-y-1"
          >
            <span
              aria-hidden="true"
              className="flex size-20 items-center justify-center rounded-full bg-surface-dim text-[32px]"
            >
              ✍️
            </span>
            <h3 className="font-display text-title-lg text-on-surface">Writing</h3>
            <p className="font-body text-body-md text-on-surface-variant">
              Task 1 &amp; Task 2 essays with detailed criteria breakdown.
            </p>
            <Marker className="mt-2 text-primary" tilt="-rotate-6">
              Start practicing →
            </Marker>
          </Link>
        </div>

        {/* Speaking — not built yet (FR-006) */}
        <div className="relative">
          <span
            aria-hidden="true"
            data-decoration
            data-tilt
            className="absolute -inset-5 rotate-3 rounded-blob-alt bg-secondary-fixed-dim opacity-70"
          />
          <div
            aria-disabled="true"
            className="relative flex h-full min-h-[340px] cursor-not-allowed flex-col items-center justify-center gap-3 rounded-blob-alt border-2 border-secondary-container bg-surface-container-lowest px-10 py-10 text-center shadow-card"
          >
            <span
              aria-hidden="true"
              className="flex size-20 items-center justify-center rounded-full bg-secondary-container text-[32px]"
            >
              🎤
            </span>
            <h3 className="font-display text-title-lg text-on-surface">Speaking</h3>
            <p className="font-body text-body-md text-on-surface-variant">
              Mock interviews with fluency and pronunciation analysis.
            </p>
            <Marker className="mt-2 text-secondary" tilt="rotate-6">
              Coming soon
            </Marker>
          </div>
        </div>
      </div>
    </section>
  );
}
