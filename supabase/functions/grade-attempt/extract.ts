// Deterministic text analysis. Runs before any model call and costs nothing.
//
// Ported from eval/src/pipeline/preprocess.py, whose docstring explains why it exists:
// an LLM asked to count the words in a 300-word essay will confidently be wrong, and
// one handed the count is not. These numbers go into every prompt labelled as ground
// truth, and the length penalty is computed from them in code, never by the model.
//
// The regexes below are JavaScript translations of Python's, chosen to match its token
// boundaries rather than to look idiomatic — the harness's benchmark numbers only
// transfer to production if both sides count the same way.

import { COHESIVE_DEVICES, STOPWORDS } from "./generated/assets.ts";

export interface TextFeatures {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgSentenceLength: number;
  uniqueWords: number;
  typeTokenRatio: number;
  repeatedContentWords: [string, number][];
  cohesiveDevicesFound: string[];
  minWordsRequired: number;
  meetsMinWords: boolean;
  lengthDeficitRatio: number;
}

// IELTS convention. Also enforced at submission time as writing_attempts.min_words.
export const MIN_WORDS: Record<string, number> = { TASK_1: 150, TASK_2: 250 };

export function minWordsFor(taskType: string): number {
  return MIN_WORDS[taskType] ?? MIN_WORDS.TASK_2;
}

// Python's \b[\w'-]+\b: a token starts and ends on a word character and may carry
// apostrophes or hyphens inside it ("don't", "well-being"), but never at the edges.
const WORD_RE = /[\p{L}\p{N}_](?:[\p{L}\p{N}_'-]*[\p{L}\p{N}_])?/gu;
const SENTENCE_SPLIT_RE = /[.!?]+(?:\s|$)/;
const PARAGRAPH_SPLIT_RE = /\n\s*\n/;
const ALNUM_RE = /[\p{L}\p{N}]/u;

// Latin letters vs everything else — a cheap proxy for "is this English-ish text".
const LATIN_RE = /[A-Za-z]/g;

export function tokenize(text: string): string[] {
  return text.match(WORD_RE) ?? [];
}

export function splitSentences(text: string): string[] {
  return text.split(SENTENCE_SPLIT_RE).map((s) => s.trim()).filter(Boolean);
}

export function splitParagraphs(text: string): string[] {
  return text.trim().split(PARAGRAPH_SPLIT_RE).map((p) => p.trim()).filter(Boolean);
}

export function countLatin(text: string): number {
  return (text.match(LATIN_RE) ?? []).length;
}

export function countAlnum(text: string): number {
  let n = 0;
  for (const ch of text) if (ALNUM_RE.test(ch)) n++;
  return n;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function findCohesiveDevices(text: string): string[] {
  const lowered = text.toLowerCase();
  const found: string[] = [];
  for (const device of COHESIVE_DEVICES) {
    if (device.includes(" ")) {
      if (lowered.includes(device)) found.push(device);
    } else if (new RegExp(`\\b${escapeRegExp(device)}\\b`).test(lowered)) {
      found.push(device);
    }
  }
  return found;
}

export function repeatedContentWords(
  words: string[],
  { minLen = 4, minCount = 3, topN = 10 } = {},
): [string, number][] {
  const counts = new Map<string, number>();
  for (const w of words) {
    const lower = w.toLowerCase();
    if (w.length < minLen || STOPWORDS.has(lower)) continue;
    counts.set(lower, (counts.get(lower) ?? 0) + 1);
  }
  // Stable descending sort, matching Counter.most_common: ties keep first-seen order,
  // which is what ends up in the prompt the model reads.
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .filter(([, n]) => n >= minCount);
}

export function extractFeatures(essayText: string, taskType: string): TextFeatures {
  const words = tokenize(essayText);
  const sentences = splitSentences(essayText);
  const paragraphs = splitParagraphs(essayText);

  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const unique = new Set(words.map((w) => w.toLowerCase())).size;
  const minRequired = minWordsFor(taskType);
  const deficit = minRequired ? Math.max(0, (minRequired - wordCount) / minRequired) : 0;

  return {
    wordCount,
    sentenceCount,
    paragraphCount: paragraphs.length,
    avgSentenceLength: sentenceCount ? wordCount / sentenceCount : 0,
    uniqueWords: unique,
    typeTokenRatio: wordCount ? unique / wordCount : 0,
    repeatedContentWords: repeatedContentWords(words),
    cohesiveDevicesFound: findCohesiveDevices(essayText),
    minWordsRequired: minRequired,
    meetsMinWords: wordCount >= minRequired,
    lengthDeficitRatio: Math.round(deficit * 10000) / 10000,
  };
}
