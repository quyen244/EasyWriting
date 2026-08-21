/**
 * The four "Why choose WriteWise?" stat cards, transcribed from the `writewise` Figma
 * design (node 1001:324) — figures, titles and captions all as designed.
 *
 * FR-009 and constitution TP-1 set the rule these captions have to satisfy: a headline
 * figure may describe a population but never promise a result to the reader. The
 * design's own captions already read that way ("Suggestions per essay…", "Pay once, use
 * forever"), so no rewriting was needed — only the `+1.5` card gained an explicit
 * "results vary" qualifier, because a band-gain number is the one figure a reader is
 * most likely to hear as a personal promise.
 */

export interface StatCard {
  stat: string;
  title: string;
  caption: string;
  /** Which swatch the card uses — the design gives each card a different one. */
  tone: "orange" | "blue" | "green" | "yellow";
}

export const WHY_WRITEWISE_STATS: StatCard[] = [
  {
    stat: "+1.5",
    title: "Improve Your Score Faster",
    caption: "A typical band gain for learners who submit regularly. Individual results vary.",
    tone: "orange",
  },
  {
    stat: "100+",
    title: "Detailed Actionable Feedback",
    caption: "Suggestions per essay, covering grammar, vocabulary, and structure.",
    tone: "blue",
  },
  {
    stat: "<1 min",
    title: "Instant Scoring",
    caption: "No waiting. Get your complete evaluation and band score immediately.",
    tone: "green",
  },
  {
    stat: "5.0+",
    title: "For Every Level",
    caption: "From band 5.0 upward, scored against the same official descriptors.",
    tone: "yellow",
  },
];
