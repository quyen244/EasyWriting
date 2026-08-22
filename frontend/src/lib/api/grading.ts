/**
 * Grading calls.
 *
 * Two rules the callers depend on:
 *
 *  1. Being under the word minimum does NOT reject the submission. It scores, records a
 *     length penalty, and reports the shortfall — which is what the result screen was
 *     designed around, and what a learner needs to see. Only text with too little usable
 *     English to assess is refused.
 *  2. Nothing here touches the caller's draft. On any thrown error the learner's essay is
 *     still in the editor, because this module never had it in the first place.
 */

import type { Locale } from "@/lib/i18n";

import { criterionLabels } from "./labels";
import {
  LATENCY,
  buildResult,
  delay,
  extractEvidence,
  getStoredResult,
  hashString,
  lengthPenaltyFor,
  newResultId,
  putStoredResult,
  scoreEssay,
  type StoredResult,
} from "./store";
import {
  ApiError,
  MIN_WORDS,
  countWords,
  type GradeInput,
  type GradingResult,
  type HistorySource,
} from "./types";

/** Below this there is not enough English to say anything about, at any band. */
const UNSCOREABLE_BELOW_WORDS = 20;

/** Task 1's three parts, joined the way a reader would read them. */
export function joinTask1(input: {
  introduction: string;
  overview: string;
  body: string;
}): string {
  return [input.introduction, input.overview, input.body]
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join("\n\n");
}

export function essayTextFor(input: GradeInput): string {
  return input.task_type === "TASK_1" ? joinTask1(input) : input.essay_text;
}

export interface GradeOptions {
  locale: Locale;
  /** Mock tests record their submissions too, and history distinguishes them. */
  source?: HistorySource;
}

export async function gradeEssay(
  input: GradeInput,
  options: GradeOptions,
): Promise<GradingResult> {
  const essay = essayTextFor(input);
  const words = countWords(essay);

  await delay(LATENCY.score);

  if (words < UNSCOREABLE_BELOW_WORDS) {
    throw new ApiError(
      "UNSCOREABLE",
      "There is not enough usable English here to score.",
      MIN_WORDS[input.task_type],
    );
  }

  const stored = storeSubmission(input, essay, words, options.source ?? "grader");
  return buildResult(stored, options.locale, criterionLabels(options.locale));
}

function storeSubmission(
  input: GradeInput,
  essay: string,
  words: number,
  source: HistorySource,
): StoredResult {
  const minimum = MIN_WORDS[input.task_type];
  const now = new Date().toISOString();

  const stored: StoredResult = {
    id: newResultId(),
    task_type: input.task_type,
    bands: scoreEssay(essay, input.task_type),
    seed: hashString(essay),
    word_count: words,
    min_words: minimum,
    length_penalty: lengthPenaltyFor(words, minimum),
    // An essay that misses the minimum is scored on less evidence than the rubric
    // assumes, so the band is flagged as what it is: an early estimate.
    provisional: words < minimum,
    created_at: now,
    scored_at: now,
    prompt_text: input.prompt_text?.trim() || null,
    essay_text: essay,
    evidence: extractEvidence(essay),
    source,
  };

  putStoredResult(stored);
  return stored;
}

export async function getResult(id: string, locale: Locale): Promise<GradingResult> {
  await delay(LATENCY.read);
  const stored = getStoredResult(id);
  if (!stored) {
    throw new ApiError("NOT_FOUND", "That result no longer exists.");
  }
  return buildResult(stored, locale, criterionLabels(locale));
}

/**
 * Grade both halves of a mock test.
 *
 * Sequential rather than parallel, and with the scoring delay paid once: two spinners
 * finishing a second apart reads as a stutter, not as progress.
 */
export async function gradeMockSubmission(
  inputs: GradeInput[],
  locale: Locale,
): Promise<GradingResult[]> {
  await delay(LATENCY.score);
  return inputs.map((input) => {
    const essay = essayTextFor(input);
    const words = countWords(essay);
    const stored = storeSubmission(input, essay, words, "mock_test");
    return buildResult(stored, locale, criterionLabels(locale));
  });
}
