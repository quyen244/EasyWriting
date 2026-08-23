// The scoreability gate. Ported from eval/src/pipeline/preprocess.py's
// `find_unscoreable_reason`.
//
// This runs before a single token is spent, so a junk submission costs zero LLM calls
// (Constitution V). A rejection here becomes `status = 'rejected'` with an `error_code`
// — a terminal state the learner sees an explanation for, not a silent failure.
//
// Deliberately conservative. These heuristics reject only clear-cut junk, because a
// false rejection costs a real learner their submission, whereas a false accept merely
// produces a low band from the rubric — which is a defensible outcome, not a bug.

import { countAlnum, countLatin, type TextFeatures } from "./extract.ts";

// Below this there is nothing meaningful to assess, whatever the task type.
export const ABSOLUTE_MIN_WORDS = 20;

export interface Rejection {
  code: string;
  reason: string;
}

export function findUnscoreableReason(
  essayText: string,
  features: TextFeatures,
): Rejection | null {
  const stripped = essayText.trim();
  if (!stripped) {
    return { code: "EMPTY_SUBMISSION", reason: "The submission is empty." };
  }

  if (features.wordCount < ABSOLUTE_MIN_WORDS) {
    return {
      code: "TOO_SHORT",
      reason:
        `The submission contains only ${features.wordCount} words, which is too ` +
        "little to assess against the band descriptors.",
    };
  }

  // Predominantly non-Latin script -> not English. Rejected, never translated.
  const alnum = countAlnum(stripped);
  if (alnum && countLatin(stripped) / alnum < 0.5) {
    return {
      code: "NOT_ENGLISH",
      reason: "The submission does not appear to be written in English.",
    };
  }

  // Degenerate vocabulary: "aaaa aaaa aaaa", or one pasted token repeated.
  if (features.wordCount >= ABSOLUTE_MIN_WORDS && features.typeTokenRatio < 0.1) {
    return {
      code: "NOT_ESSAY_PROSE",
      reason:
        "The submission repeats the same few words and is not recognizable as " +
        "essay writing.",
    };
  }

  // No sentence punctuation at all across a long text -> code dump, word salad.
  if (features.sentenceCount <= 1 && features.wordCount > 80) {
    return {
      code: "NOT_ESSAY_PROSE",
      reason:
        "The submission has no sentence structure and is not recognizable as " +
        "essay writing.",
    };
  }

  return null;
}
