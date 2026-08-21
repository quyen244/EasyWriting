/**
 * The three inline FAQ entries (002 T013, data-model.md `FaqTeaserItem`, FR-020).
 *
 * Separate from `lib/faqData.ts` on purpose: that file backs the standalone `/faq` page,
 * which this feature does not own (specs/README.md).
 *
 * The first two answers are adapted from `faqData.ts`'s `"accuracy"` and `"task-types"`
 * entries. The third is written fresh rather than adapted from `"how-scoring-works"`,
 * whose wording — "quotes taken verbatim from your essay" — describes the retired
 * four-call pipeline, not 001's current grader (band + bilingual comment per criterion;
 * machine-verified evidence anchoring is exactly what constitution TP-1 still leaves
 * open). Reusing it would make this page's own FR-011 false the day it shipped.
 *
 * `faqData.ts` still carries that stale claim. Refreshing it belongs to whoever picks up
 * the `/faq` page — noted here so it isn't lost, not fixed here (research.md R6).
 */

export interface FaqTeaserItem {
  question: string;
  answer: string;
}

export const FAQ_TEASER_ITEMS: FaqTeaserItem[] = [
  {
    question: "How accurate is the AI scoring?",
    answer:
      "Scoring is benchmarked against a set of essays with known bands, and that benchmark is re-run whenever the method changes. It is close enough to be genuinely useful for practice, and it is not a substitute for a certified examiner.",
  },
  {
    question: "Does it support both Task 1 and Task 2?",
    answer:
      "Both. Task 1 needs at least 150 words and is scored on Task Achievement; Task 2 needs at least 250 and is scored on Task Response. You submit one task at a time — a full timed two-task mock test is a separate feature we have not built yet.",
  },
  {
    question: "Will I understand why I got a certain score?",
    answer:
      "Yes. Each of the four criteria comes back with its own band and a written comment, in English and Vietnamese, explaining what earned that band against the official descriptors. The comments explain the judgement; they are not a line-by-line rewrite of your essay.",
  },
];
