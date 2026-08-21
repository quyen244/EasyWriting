import Link from "next/link";

import { MicIcon, PencilIcon } from "@/components/ui/Icon";
import Reveal from "@/components/motion/Reveal";
import SectionLabel from "@/components/ui/SectionLabel";
import { Marker } from "@/components/ui/Sticker";
import { GRADER_HREF } from "@/lib/navigation";

/**
 * "Choose your focus area" — cloned from the reference's Skill Selection section.
 *
 * The two cards look symmetrical by design, which is exactly the risk FR-006 names: a
 * visitor must not read Speaking as an equally-available option. Three things separate
 * them, and none of them is colour — Writing is a real link while Speaking is not an
 * anchor at all, Speaking's marker says "Coming soon" in text, and that card announces
 * itself through `aria-disabled` rather than relying on the blue tint.
 *
 * The tilted colour shape behind each card is the reference's `organic-shape-*`, kept
 * as a percentage radius so it stays proportional at any card size.
 */
export default function FocusAreaSelector() {
  return (
    <section id="focus-area" className="mx-auto max-w-container px-margin-mobile py-16">
      <Reveal variant="cut" className="mb-16 flex flex-col items-center gap-4 text-center">
        <SectionLabel index={1} align="center">
          Choose a skill
        </SectionLabel>
        <h2 className="font-display text-display-lg-mobile text-on-surface md:text-display-lg">
          Choose your <em className="italic">focus area</em>
        </h2>
        <p className="max-w-xl font-body text-body-lg text-on-surface-variant">
          Select the skill you want to improve today with targeted AI feedback.
        </p>
      </Reveal>

      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-12 md:flex-row md:items-stretch">
        {/* Writing — available today */}
        <div className="group relative w-full md:w-1/2">
          <span
            aria-hidden="true"
            data-decoration
            data-tilt
            className="absolute inset-0 -rotate-3 scale-105 rounded-blob bg-accent-peach opacity-70 transition-transform group-hover:scale-110"
          />
          <Link
            href={GRADER_HREF}
            className="relative z-10 flex h-full flex-col items-center rounded-blob border-2 border-surface-dim bg-surface-container-lowest p-10 text-center shadow-card transition-transform group-hover:-translate-y-2"
          >
            <span className="mb-6 flex size-20 items-center justify-center rounded-full bg-surface-dim">
              <PencilIcon className="size-10 text-primary" />
            </span>
            <h3 className="mb-3 font-display text-title-lg text-on-surface">Writing</h3>
            <p className="mb-6 font-body text-body-md text-on-surface-variant">
              Task 1 &amp; Task 2 essays with detailed criteria breakdown.
            </p>
            <Marker className="mt-auto text-primary" tilt="-rotate-6">
              Start practicing →
            </Marker>
          </Link>
        </div>

        {/* Speaking — not built yet (FR-006) */}
        <div className="group relative w-full md:w-1/2">
          <span
            aria-hidden="true"
            data-decoration
            data-tilt
            className="absolute inset-0 rotate-3 scale-105 rounded-blob-alt bg-secondary-fixed-dim opacity-70"
          />
          <div
            aria-disabled="true"
            className="relative z-10 flex h-full cursor-not-allowed flex-col items-center rounded-blob-alt border-2 border-secondary-container bg-surface-container-lowest p-10 text-center shadow-card"
          >
            <span className="mb-6 flex size-20 items-center justify-center rounded-full bg-secondary-container">
              <MicIcon className="size-10 text-secondary" />
            </span>
            <h3 className="mb-3 font-display text-title-lg text-on-surface">Speaking</h3>
            <p className="mb-6 font-body text-body-md text-on-surface-variant">
              Mock interviews with fluency and pronunciation analysis.
            </p>
            <Marker className="mt-auto text-secondary" tilt="rotate-6">
              Coming soon
            </Marker>
          </div>
        </div>
      </div>
    </section>
  );
}
