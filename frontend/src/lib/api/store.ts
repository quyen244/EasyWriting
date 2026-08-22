/**
 * The mock transport: session state, deterministic scoring, and the latency that makes
 * loading states real.
 *
 * ── Why mock mode lives here rather than in the tests ───────────────────────────────
 *
 * Stubbing `fetch` would mean the mock had to speak HTTP, and every screen would depend
 * on a request that does not exist. Putting the mock behind the same module boundary the
 * real transport will use means the swap later is one file: the screens above never knew
 * which one answered.
 *
 * ── Why results are stored un-rendered ──────────────────────────────────────────────
 *
 * A stored result holds bands, evidence and a seed — not sentences. Feedback prose is
 * composed at read time from the requested locale, so switching the interface language
 * re-renders old results in the new language instead of freezing them in whichever
 * language they happened to be graded in.
 *
 * ── Why scoring is deterministic ────────────────────────────────────────────────────
 *
 * The same essay must produce the same band twice. A random mock contradicts itself the
 * first time anyone re-grades to check, which reads as a broken product rather than a
 * demo.
 */

import { CRITERION_FEEDBACK, bandTier } from "@/mockData/criteriaFeedback";
import {
  SEEDED_ATTEMPTS,
  SEEDED_MOCK_ATTEMPTS,
  SEEDED_MODULE_PROGRESS,
  SEEDED_PRACTICE_SESSIONS,
  type SeededAttempt,
} from "@/mockData/history";
import { text, type Locale } from "@/mockData/localized";

import {
  CRITERIA_BY_TASK,
  MIN_WORDS,
  clampBand,
  toHalfBand,
  type CriterionCode,
  type GradingCriterion,
  type GradingResult,
  type HistorySource,
  type TaskType,
} from "./types";

/**
 * Mock mode is the default, and opting out is explicit.
 *
 * The inverse — "mock unless an API URL is set" — would silently break the whole
 * authenticated product the moment someone set the URL for the one endpoint that exists.
 */
export const USE_REAL_API = process.env.NEXT_PUBLIC_USE_REAL_API === "true";

const LATENCY_OVERRIDE = Number(process.env.NEXT_PUBLIC_MOCK_LATENCY_MS);

/** Reads are quick; scoring is slow enough to be worth a progress state. */
export const LATENCY = {
  read: Number.isFinite(LATENCY_OVERRIDE) ? LATENCY_OVERRIDE : 220,
  write: Number.isFinite(LATENCY_OVERRIDE) ? LATENCY_OVERRIDE : 420,
  score: Number.isFinite(LATENCY_OVERRIDE) ? LATENCY_OVERRIDE : 1400,
};

export function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const PIPELINE_VERSION = "pipeline-v1.0";
export const MODEL_ID = "writewise/scoring-preview";

// ── Deterministic pseudo-randomness ───────────────────────────────────────────

/** FNV-1a. Small, stable, and good enough to spread similar essays apart. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// ── Stored shape ──────────────────────────────────────────────────────────────

export interface StoredResult {
  id: string;
  task_type: TaskType;
  bands: Record<CriterionCode, number>;
  /** Chooses which feedback variant each criterion gets. Stable per result. */
  seed: number;
  word_count: number;
  min_words: number;
  length_penalty: number;
  provisional: boolean;
  created_at: string;
  scored_at: string;
  prompt_text: string | null;
  essay_text: string;
  /** Verbatim spans from the essay. Extracted, never generated. */
  evidence: string[];
  source: HistorySource;
}

interface SessionStore {
  results: Map<string, StoredResult>;
  /** Insertion order is not date order once a learner grades an old prompt again. */
  order: string[];
  moduleProgress: Record<string, number>;
  practiceSessions: { id: string; module_id: string; at: string; completed: number }[];
  mockAttempts: { id: string; test_id: string; submitted_at: string; attempt_ids: string[] }[];
  seeded: boolean;
}

const store: SessionStore = {
  results: new Map(),
  order: [],
  moduleProgress: {},
  practiceSessions: [],
  mockAttempts: [],
  seeded: false,
};

function seededToStored(attempt: SeededAttempt): StoredResult {
  const codes = CRITERIA_BY_TASK[attempt.task_type];
  const bands = {} as Record<CriterionCode, number>;
  for (const code of codes) {
    bands[code] = attempt.bands[code] ?? 6;
  }

  return {
    id: attempt.id,
    task_type: attempt.task_type,
    bands,
    seed: hashString(attempt.id),
    word_count: attempt.word_count,
    min_words: MIN_WORDS[attempt.task_type],
    length_penalty: 0,
    provisional: attempt.provisional,
    created_at: attempt.created_at,
    scored_at: attempt.created_at,
    prompt_text: attempt.prompt,
    // Seeded attempts keep their evidence rather than a full essay: the quotes are what
    // the result screen renders, and a fabricated 300-word essay behind them would add
    // nothing a learner ever sees.
    essay_text: attempt.evidence.join(" "),
    evidence: attempt.evidence,
    source: attempt.source,
  };
}

/**
 * Populate the session on first read.
 *
 * Lazy rather than at module load so a test can reset and re-seed, and so importing the
 * client from a server component does not build a learner's history as a side effect.
 */
export function ensureSeeded(): void {
  if (store.seeded) return;
  store.seeded = true;

  for (const attempt of SEEDED_ATTEMPTS) {
    const stored = seededToStored(attempt);
    store.results.set(stored.id, stored);
    store.order.push(stored.id);
  }
  store.moduleProgress = { ...SEEDED_MODULE_PROGRESS };
  store.practiceSessions = [...SEEDED_PRACTICE_SESSIONS];
  store.mockAttempts = [...SEEDED_MOCK_ATTEMPTS];
}

/** Test seam: drop everything and start from the fixtures again. */
export function resetStore(): void {
  store.results.clear();
  store.order = [];
  store.moduleProgress = {};
  store.practiceSessions = [];
  store.mockAttempts = [];
  store.seeded = false;
}

export function allStoredResults(): StoredResult[] {
  ensureSeeded();
  return store.order
    .map((id) => store.results.get(id))
    .filter((value): value is StoredResult => value !== undefined)
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
}

export function getStoredResult(id: string): StoredResult | undefined {
  ensureSeeded();
  return store.results.get(id);
}

export function putStoredResult(result: StoredResult): void {
  ensureSeeded();
  if (!store.results.has(result.id)) store.order.push(result.id);
  store.results.set(result.id, result);
}

export function getModuleProgress(): Record<string, number> {
  ensureSeeded();
  return store.moduleProgress;
}

export function setModuleProgress(moduleId: string, completed: number): void {
  ensureSeeded();
  const current = store.moduleProgress[moduleId] ?? 0;
  // Progress only ever moves forward. Re-running exercise 1 of a finished module must
  // not reset the learner to "1 of 3 done".
  store.moduleProgress[moduleId] = Math.max(current, completed);
}

export function recordPracticeSession(moduleId: string, completed: number): void {
  ensureSeeded();
  store.practiceSessions.unshift({
    id: `prc_${Date.now()}`,
    module_id: moduleId,
    at: new Date().toISOString(),
    completed,
  });
}

export function allPracticeSessions() {
  ensureSeeded();
  return store.practiceSessions;
}

export function allMockAttempts() {
  ensureSeeded();
  return store.mockAttempts;
}

export function recordMockAttempt(attempt: {
  id: string;
  test_id: string;
  submitted_at: string;
  attempt_ids: string[];
}): void {
  ensureSeeded();
  store.mockAttempts.unshift(attempt);
}

// ── Scoring ───────────────────────────────────────────────────────────────────

const SENTENCE_SPLIT = /(?<=[.!?])\s+/;

/** Words a band-7 writer reaches for. Crude, but stable and explainable. */
const RANGE_MARKERS = [
  "although",
  "whereas",
  "despite",
  "nevertheless",
  "consequently",
  "furthermore",
  "which",
  "while",
  "unless",
  "moreover",
  "arguably",
  "significantly",
  "substantially",
  "notably",
];

interface EssaySignals {
  words: number;
  sentences: number;
  averageSentenceLength: number;
  /** Unique words ÷ total words. A proxy for lexical range. */
  typeTokenRatio: number;
  rangeMarkers: number;
  paragraphs: number;
}

export function analyseEssay(essay: string): EssaySignals {
  const tokens = essay.toLowerCase().match(/\b[\w'-]+\b/g) ?? [];
  const sentences = essay
    .split(SENTENCE_SPLIT)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const unique = new Set(tokens);
  const markers = tokens.filter((token) => RANGE_MARKERS.includes(token)).length;

  return {
    words: tokens.length,
    sentences: sentences.length,
    averageSentenceLength: sentences.length > 0 ? tokens.length / sentences.length : 0,
    typeTokenRatio: tokens.length > 0 ? unique.size / tokens.length : 0,
    rangeMarkers: markers,
    paragraphs: essay.split(/\n{2,}/).filter((p) => p.trim().length > 0).length,
  };
}

/**
 * Turn an essay into four bands.
 *
 * These are heuristics standing in for a model, and they are chosen so the demo behaves
 * the way a learner expects it to: writing more, varying vocabulary, using subordination
 * and paragraphing all move the number that they should move. Nothing here claims to be
 * an assessment.
 */
export function scoreEssay(essay: string, taskType: TaskType): Record<CriterionCode, number> {
  const signals = analyseEssay(essay);
  const minimum = MIN_WORDS[taskType];
  const seed = hashString(essay.trim().toLowerCase());
  // ±0.25 of stable jitter, so two essays with identical statistics do not score
  // identically — without ever making the same essay score differently twice.
  const jitter = ((seed % 3) - 1) * 0.25;

  const lengthRatio = minimum > 0 ? signals.words / minimum : 1;
  const lengthScore = Math.min(1.15, lengthRatio);

  const taskBand = 4.5 + lengthScore * 1.9 + Math.min(signals.paragraphs, 4) * 0.15;
  const coherenceBand =
    4.6 + Math.min(signals.paragraphs, 4) * 0.42 + Math.min(signals.rangeMarkers, 8) * 0.09;
  const lexicalBand = 4.2 + signals.typeTokenRatio * 6.2;
  const grammarBand =
    4.4 +
    Math.min(signals.rangeMarkers, 10) * 0.16 +
    // Sentences that are neither choppy nor runaway: 14–24 words is the sweet spot.
    (signals.averageSentenceLength >= 14 && signals.averageSentenceLength <= 24 ? 1.1 : 0.3);

  const byCode: Partial<Record<CriterionCode, number>> = {
    TASK_ACHIEVEMENT: taskBand,
    TASK_RESPONSE: taskBand,
    COHERENCE_COHESION: coherenceBand,
    LEXICAL_RESOURCE: lexicalBand,
    GRAMMATICAL_RANGE: grammarBand,
  };

  const bands = {} as Record<CriterionCode, number>;
  for (const code of CRITERIA_BY_TASK[taskType]) {
    bands[code] = clampBand(toHalfBand((byCode[code] ?? 6) + jitter));
  }
  return bands;
}

/** Under the minimum by more than a tenth costs half a band, as the descriptors allow. */
export function lengthPenaltyFor(words: number, minimum: number): number {
  if (words >= minimum) return 0;
  return words < minimum * 0.9 ? 0.5 : 0;
}

/**
 * Pull real sentences out of the learner's own writing.
 *
 * Extracted verbatim and never paraphrased: a "quote" the learner did not write is the
 * one thing evidence-anchored feedback must never produce.
 */
export function extractEvidence(essay: string, count = 2): string[] {
  const sentences = essay
    .split(SENTENCE_SPLIT)
    .map((sentence) => sentence.trim().replace(/\s+/g, " "))
    .filter((sentence) => sentence.split(" ").length >= 6);

  if (sentences.length === 0) return [];

  // First and longest: the opening is what an examiner reads first, and the longest
  // sentence is where range and accuracy are most visible.
  const longest = [...sentences].sort((a, b) => b.length - a.length)[0];
  const picked = [sentences[0]];
  if (longest && longest !== sentences[0]) picked.push(longest);
  return picked.slice(0, count);
}

// ── Composition ───────────────────────────────────────────────────────────────

function criterionFrom(
  code: CriterionCode,
  band: number,
  seed: number,
  index: number,
  evidence: string[],
  locale: Locale,
  label: string,
): GradingCriterion {
  const variants = CRITERION_FEEDBACK[code][bandTier(band)];
  const variant = variants[(seed + index) % variants.length];

  return {
    code,
    label,
    band,
    comment: text(variant.comment, locale),
    improvement: text(variant.improvement, locale),
    // Evidence is spread rather than repeated: the same two sentences under all four
    // criteria reads as decoration, not as anchoring.
    evidence_quotes: evidence.length > 0 ? [evidence[index % evidence.length]] : [],
  };
}

/**
 * Compose the wire result a screen actually renders.
 *
 * `labels` comes from the caller because the UI owns the canonical label catalogue — the
 * transport should not decide what a criterion is called in Vietnamese.
 */
/**
 * The overall band, derived from the four criteria and the length penalty.
 *
 * Everything that needs an overall — the result screen, the history list, the trend
 * chart — comes through here. A second implementation somewhere else is how a history
 * row ends up disagreeing with the result it opens.
 */
export function overallBandOf(stored: StoredResult): number {
  const codes = CRITERIA_BY_TASK[stored.task_type];
  const mean = codes.reduce((sum, code) => sum + stored.bands[code], 0) / codes.length;
  return clampBand(toHalfBand(mean - stored.length_penalty));
}

export function buildResult(
  stored: StoredResult,
  locale: Locale,
  labels: Record<CriterionCode, string>,
): GradingResult {
  const codes = CRITERIA_BY_TASK[stored.task_type];
  const criteria = codes.map((code, index) =>
    criterionFrom(
      code,
      stored.bands[code],
      stored.seed,
      index,
      stored.evidence,
      locale,
      labels[code],
    ),
  );

  const overall = overallBandOf(stored);

  return {
    id: stored.id,
    task_type: stored.task_type,
    status: "scored",
    overall_band: overall,
    criteria,
    word_count: stored.word_count,
    min_words: stored.min_words,
    length_penalty: stored.length_penalty,
    provisional: stored.provisional,
    pipeline_version: PIPELINE_VERSION,
    model_id: MODEL_ID,
    created_at: stored.created_at,
    scored_at: stored.scored_at,
    prompt_text: stored.prompt_text,
    essay_text: stored.essay_text,
  };
}

export function newResultId(): string {
  return `sub_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export type { Locale };
