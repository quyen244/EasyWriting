/**
 * Testimonial content, transcribed from the reference's Testimonials section
 * (`stitch_ai_ielts_writing_evaluator/code.html`).
 *
 * ⚠️ These are **illustrative examples, not collected feedback**. No real learner has
 * said these words, and the avatars in the reference are stock images of people with no
 * connection to this product. The previous version of this page made the same call and
 * said so out loud, and that was right: attributing invented praise to a named person
 * has to be a deliberate decision someone signed off on, never an accident of
 * transcribing a design file. `TestimonialCard`'s section renders a visible disclosure
 * to that effect — removing it turns this content into fabricated endorsements. Replace
 * these with real, permissioned quotes before launch.
 *
 * On General Training: `ALL_TESTIMONIALS` keeps the reference's General Training entry
 * (Alex Tran); `TESTIMONIALS` — the set the page actually renders — filters it out,
 * because 001-ielts-score-assessment cannot score that track yet (spec.md's flagged
 * decision, confirmed 2026-08-21). data-model.md sets a deliberately higher bar here
 * than for a nav link: a disabled link withholds a route, whereas a published
 * testimonial asserts that a named person got a result the product cannot produce.
 *
 * The fourth entry keeps the rendered set at three once Alex Tran is held back, which
 * FR-017 requires.
 */

export interface Testimonial {
  quote: string;
  /** The phrase the reference highlights inside the quote. Must appear in `quote`. */
  highlight: string;
  name: string;
  track: "Academic" | "General Training";
  /** Band progress badge, e.g. "6.5 → 7.5". */
  progress: string;
  /** The reference gives one testimonial the large featured treatment. */
  featured?: boolean;
}

/** Tracks 001's grader can actually score today. */
export const SUPPORTED_TRACKS: Testimonial["track"][] = ["Academic"];

export const ALL_TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "WriteWise completely changed my approach to Task 2. The instant feedback helped me identify my repetitive grammar mistakes immediately.",
    highlight: "instant feedback",
    name: "Nguyễn Minh Anh",
    track: "Academic",
    progress: "6.5 → 7.5",
    featured: true,
  },
  {
    quote:
      "I was stuck at 6.0 for months. Using WriteWise every day for a month gave me the vocabulary boost I needed to finally hit 7.0.",
    highlight: "vocabulary boost",
    name: "Alex Tran",
    track: "General Training",
    progress: "6.0 → 7.0",
  },
  {
    quote:
      "The nuanced feedback on Coherence and Cohesion was exactly what I needed to push my score to an 8.0. Highly recommended!",
    highlight: "Coherence and Cohesion",
    name: "Sarah Nguyen",
    track: "Academic",
    progress: "7.0 → 8.0",
  },
  {
    quote:
      "My vocabulary band stopped being a mystery. The comment named which words were too basic and what the descriptors expect at the band above.",
    highlight: "which words were too basic",
    name: "Thu Hà",
    track: "Academic",
    progress: "6.0 → 7.0",
  },
];

/** What the page renders — see the General Training note above. */
export const TESTIMONIALS: Testimonial[] = ALL_TESTIMONIALS.filter((t) =>
  SUPPORTED_TRACKS.includes(t.track),
);
