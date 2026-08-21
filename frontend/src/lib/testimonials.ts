/**
 * Testimonial content (002 T011, data-model.md `Testimonial`, FR-017/FR-018).
 *
 * ⚠️ These are **illustrative examples, not collected feedback**. No real learner has
 * said these words. The previous version of this page made the same call and said so
 * out loud, and that was right: attributing invented praise to a named person has to be
 * a deliberate decision someone signed off on, never an accident of transcribing a
 * design file. `TestimonialCard`'s section renders a visible disclosure to that effect —
 * removing it turns this content into fabricated endorsements. Replace these with real,
 * permissioned quotes before launch.
 *
 * On General Training: `ALL_TESTIMONIALS` keeps the design's General Training entry;
 * `TESTIMONIALS` — the set the page actually renders — filters it out, because
 * 001-ielts-score-assessment cannot score that track yet (spec.md's flagged decision,
 * confirmed 2026-08-21). data-model.md sets a deliberately higher bar here than for a
 * nav link: a disabled link withholds a route, whereas a published testimonial asserts
 * that a named person got a result the product cannot currently produce.
 */

export interface Testimonial {
  quote: string;
  name: string;
  track: "Academic" | "General Training";
}

/** Tracks 001's grader can actually score today. */
export const SUPPORTED_TRACKS: Testimonial["track"][] = ["Academic"];

export const ALL_TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "It caught the same grammar mistake repeating across three paragraphs — something I had read straight past every time I checked my own work.",
    name: "Minh Anh",
    track: "Academic",
  },
  {
    quote:
      "My vocabulary band stopped being a mystery. The comment named which words were too basic and what the descriptors expect at the band above.",
    name: "Thu Hà",
    track: "Academic",
  },
  {
    quote:
      "Coherence and cohesion had been my lowest band for months. Seeing it scored on its own, every submission, is what finally moved it.",
    name: "Đức Long",
    track: "Academic",
  },
  {
    quote:
      "The letter task feedback was specific about tone and structure rather than just marking it down.",
    name: "Phương Linh",
    track: "General Training",
  },
];

/** What the page renders — see the General Training note above. */
export const TESTIMONIALS: Testimonial[] = ALL_TESTIMONIALS.filter((t) =>
  SUPPORTED_TRACKS.includes(t.track),
);
