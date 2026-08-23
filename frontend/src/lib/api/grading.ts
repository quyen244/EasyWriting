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
 *
 * When Supabase is configured this talks to the real marker, and the shape of that
 * conversation is worth understanding: the client does NOT call a scoring endpoint. It
 * inserts a row into `writing_attempts` with `status = 'queued'` and then waits for that
 * row to change (constitution Principle VIII). A database trigger dispatches the
 * `grade-attempt` Edge Function, which is the only thing in the system that can write a
 * band — RLS gives `authenticated` no grant on any score-bearing column, so this is
 * structural rather than a convention this file chooses to honour.
 *
 * The practical consequence: marking survives the tab closing. The row is already
 * queued, the work happens server-side, and the result is in history whether or not
 * anyone was watching.
 */

import type { Locale } from "@/lib/i18n";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

import { criterionLabels, normaliseCriterionCode } from "./labels";
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
import { toApiError } from "./supabase";
import {
  ApiError,
  MIN_WORDS,
  countWords,
  type CriterionCode,
  type GradeInput,
  type GradingCriterion,
  type GradingResult,
  type HistorySource,
  type TaskType,
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

  // Checked here as well as server-side, on purpose. The server gate is the one that
  // counts — it is what stops a junk submission from costing four model calls — but
  // catching it in the browser turns a round trip into instant feedback, and the
  // learner gets the same answer either way.
  if (words < UNSCOREABLE_BELOW_WORDS) {
    throw new ApiError(
      "UNSCOREABLE",
      "There is not enough usable English here to score.",
      MIN_WORDS[input.task_type],
    );
  }

  if (isSupabaseConfigured) {
    return submitForMarking(input, essay, words, options);
  }

  await delay(LATENCY.score);
  const stored = storeSubmission(input, essay, words, options.source ?? "grader");
  return buildResult(stored, options.locale, criterionLabels(options.locale));
}

// ── The real marker ───────────────────────────────────────────────────────────

/** Statuses a row stops at. Anything else means marking is still in progress. */
const TERMINAL_STATUSES = new Set(["scored", "failed", "rejected"]);

/**
 * How long to watch before handing the learner back their editor.
 *
 * Measured basis, not a guess: the four criterion calls run concurrently and the
 * benchmark's p95 for a full assessment was 23.9s (specs/00-grading-feature/
 * phase-a-findings.md). Three minutes covers that with room for a repair retry and a
 * cold function start.
 *
 * Giving up here does NOT cancel anything. The row is still queued or scoring, the
 * marker still finishes, and the result appears in history — which is exactly what the
 * message below promises.
 */
const WATCH_TIMEOUT_MS = 180_000;

/** How often to ask whether marking has finished. */
const POLL_INTERVAL_MS = 2_000;

const RESULT_COLUMNS =
  "id, task_type, status, error_code, overall_band, criteria, word_count, min_words, " +
  "length_penalty, provisional, pipeline_version, model_id, created_at, scored_at, " +
  "prompt_text, essay_text";

interface Bilingual {
  en: string;
  vi: string;
}

/** One element of `writing_attempts.criteria`, as the Edge Function writes it. */
interface StoredCriterion {
  code: string;
  label?: string;
  band: number;
  comment: Bilingual;
  improvement: Bilingual;
  evidence?: { quote: string; comment: string }[];
}

interface AttemptRow {
  id: string;
  task_type: TaskType;
  status: string;
  error_code: string | null;
  overall_band: number | null;
  criteria: StoredCriterion[] | null;
  word_count: number;
  min_words: number;
  length_penalty: number;
  provisional: boolean;
  pipeline_version: string | null;
  model_id: string | null;
  created_at: string;
  scored_at: string | null;
  prompt_text: string | null;
  essay_text: string;
}

async function submitForMarking(
  input: GradeInput,
  essay: string,
  words: number,
  options: GradeOptions,
): Promise<GradingResult> {
  const client = getSupabaseBrowserClient();

  const { data: sessionData } = await client.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) {
    throw new ApiError("SESSION_EXPIRED", "Please sign in again to submit your writing.");
  }

  // Only the columns `authenticated` actually holds an INSERT grant on. Anything
  // score-bearing is absent because it is unreachable from a user token, not because
  // it was forgotten.
  const row: Record<string, unknown> = {
    user_id: userId,
    source: options.source ?? "grader",
    task_type: input.task_type,
    prompt_text: input.prompt_text?.trim() || null,
    essay_text: essay,
    word_count: words,
    min_words: MIN_WORDS[input.task_type],
  };

  if (input.task_type === "TASK_1") {
    // Stored as three parts because examiners mark them as three parts; `essay_text`
    // above is the joined form, which is what the word count and the model see.
    row.task1_introduction = input.introduction.trim() || null;
    row.task1_overview = input.overview.trim() || null;
    row.task1_body = input.body.trim() || null;
    row.chart_description = input.chart_description?.trim() || null;
  }

  const { data, error } = await client
    .from("writing_attempts")
    .insert(row)
    .select("id")
    .single();

  if (error) throw toApiError(error);

  const finished = await watchAttempt(client, data.id as string);
  return toGradingResult(finished, options.locale);
}

/**
 * Wait for one attempt to reach a terminal status.
 *
 * Polling, not realtime, and that is a deliberate step down in sophistication. The
 * table IS in the realtime publication and a subscription would shave a second or two
 * off a wait that is normally fifteen to thirty — but it also introduces a WebSocket
 * whose failure modes (dropped socket, environment without a usable WebSocket, a
 * message arriving before the subscription is live) all have to be handled by falling
 * back to polling anyway. Given that, the poll is not the fallback; it is the whole
 * mechanism, and there is nothing left to go quietly wrong.
 *
 * Realtime is worth revisiting if marking ever gets fast enough for two seconds to be
 * a noticeable share of the wait. It is not today.
 */
async function watchAttempt(client: SupabaseClient, id: string): Promise<AttemptRow> {
  const readRow = async (): Promise<AttemptRow | null> => {
    const { data, error } = await client
      .from("writing_attempts")
      .select(RESULT_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (error) throw toApiError(error);
    const row = data as AttemptRow | null;
    return row && TERMINAL_STATUSES.has(row.status) ? row : null;
  };

  const deadline = Date.now() + WATCH_TIMEOUT_MS;
  for (;;) {
    // Checked before the first sleep: a submission the gate rejects is finished before
    // this function is even called, and making that learner wait two seconds to be told
    // so would be waiting for nothing.
    const row = await readRow();
    if (row) return row;

    if (Date.now() >= deadline) {
      throw new ApiError(
        "SCORING_FAILED",
        "Marking is taking longer than usual. Your writing is safe and the result " +
          "will appear in your history when it is ready.",
      );
    }
    await delay(POLL_INTERVAL_MS);
  }
}

function toGradingResult(row: AttemptRow, locale: Locale): GradingResult {
  if (row.status === "rejected") {
    throw new ApiError(
      "UNSCOREABLE",
      "There is not enough usable English here to score.",
      row.min_words,
    );
  }

  if (row.status !== "scored" || row.overall_band === null || !row.criteria) {
    // Includes 'failed'. Retryable: the same text submitted again usually succeeds,
    // because the cause is a model or transport hiccup rather than the writing.
    throw new ApiError(
      "SCORING_FAILED",
      "Marking could not be completed. Please try submitting again.",
    );
  }

  const labels = criterionLabels(locale);
  return {
    id: row.id,
    task_type: row.task_type,
    status: "scored",
    overall_band: row.overall_band,
    criteria: row.criteria.map((c) => toCriterion(c, locale, labels)),
    word_count: row.word_count,
    min_words: row.min_words,
    length_penalty: row.length_penalty,
    provisional: row.provisional,
    pipeline_version: row.pipeline_version ?? "",
    model_id: row.model_id ?? "",
    created_at: row.created_at,
    scored_at: row.scored_at ?? row.created_at,
    prompt_text: row.prompt_text,
    essay_text: row.essay_text,
  };
}

function toCriterion(
  stored: StoredCriterion,
  locale: Locale,
  labels: Record<CriterionCode, string>,
): GradingCriterion {
  // The database stores the official `GRAMMATICAL_RANGE_ACCURACY`; the UI speaks the
  // shorter spelling. Normalising here means exactly one spelling reaches a component.
  const code = normaliseCriterionCode(stored.code);
  return {
    code,
    // The row carries a label and the UI ignores it, as everywhere else in this
    // boundary: interface text has to exist in both locales, and the marker has no
    // business deciding which one a learner reads.
    label: labels[code],
    band: stored.band,
    comment: pickLocale(stored.comment, locale),
    improvement: pickLocale(stored.improvement, locale),
    evidence_quotes: (stored.evidence ?? []).map((e) => e.quote),
  };
}

/**
 * Read one language out of a bilingual field.
 *
 * Falling back to the other language is not defensive padding: `criteria_match_task()`
 * guarantees both `comment` languages are non-empty, but says nothing about
 * `improvement`, so a one-language improvement is a row the database would accept. An
 * empty panel is worse than a panel in the wrong language.
 */
function pickLocale(value: Bilingual | null | undefined, locale: Locale): string {
  if (!value) return "";
  const preferred = locale === "vi" ? value.vi : value.en;
  const other = locale === "vi" ? value.en : value.vi;
  return preferred?.trim() || other?.trim() || "";
}

// ── The mock transport ────────────────────────────────────────────────────────

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
  if (isSupabaseConfigured) {
    const client = getSupabaseBrowserClient();
    const { data, error } = await client
      .from("writing_attempts")
      .select(RESULT_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) throw toApiError(error);
    // RLS makes "someone else's result" indistinguishable from "no such result", which
    // is the correct thing for it to leak: nothing.
    if (!data) throw new ApiError("NOT_FOUND", "That result no longer exists.");
    // Through `unknown`: postgrest-js widens a select with a string column list to a
    // union that includes its own error shape, so TypeScript will not narrow it to a
    // row type directly. The runtime shape is checked by `toGradingResult`, which
    // refuses anything that is not a completed, four-criterion result.
    return toGradingResult(data as unknown as AttemptRow, locale);
  }

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
 * Still on the mock transport while the grader moves to the real pipeline. Not an
 * oversight: a mock sitting needs both halves marked before it means anything, and the
 * sitting bookkeeping around it (`mock_test_attempts`, the combined-band trigger) is a
 * second thing to get right. Wiring it is its own piece of work, and doing it in the
 * same change as the grader would make both harder to verify.
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
