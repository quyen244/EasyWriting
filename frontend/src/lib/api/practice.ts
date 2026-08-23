/**
 * Practice calls.
 *
 * The feedback this returns is deliberately not a band. A three-sentence drill cannot
 * support a band, and printing one would teach a learner to read noise as a score. What
 * it returns instead is observations about their answer — length, whether they reused the
 * source's words, whether they subordinated anything — beside the model answer, which is
 * the comparison that actually teaches.
 */

import { translate, type Locale, type MessageKey } from "@/lib/i18n";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { PRACTICE_MODULES, findModule } from "@/mockData/practice";
import { text, textList, type LocalizedText } from "@/mockData/localized";

import { normaliseCriterionCode } from "./labels";
import { toApiError } from "./supabase";
import {
  LATENCY,
  delay,
  getModuleProgress,
  recordPracticeSession,
  setModuleProgress,
} from "./store";
import {
  ApiError,
  countWords,
  type CriterionCode,
  type Difficulty,
  type PracticeAttempt,
  type PracticeExercise,
  type PracticeFeedback,
  type PracticeModuleDetail,
  type PracticeModuleSummary,
  type TaskType,
} from "./types";

function summarise(
  practiceModule: (typeof PRACTICE_MODULES)[number],
  locale: Locale,
  progress: Record<string, number>,
): PracticeModuleSummary {
  return {
    id: practiceModule.id,
    task_type: practiceModule.task_type,
    title: text(practiceModule.title, locale),
    description: text(practiceModule.description, locale),
    difficulty: practiceModule.difficulty,
    exercise_count: practiceModule.exercises.length,
    completed_count: Math.min(
      progress[practiceModule.id] ?? 0,
      practiceModule.exercises.length,
    ),
    trains: practiceModule.trains,
  };
}

// ── Supabase-backed content (mock test picker aside, this is the real content path) ──

const MODULE_SELECT =
  "id, task_type, title, description, difficulty, trains, position, practice_exercises(id)";
const MODULE_DETAIL_SELECT =
  "id, task_type, title, description, intro, difficulty, trains, " +
  "practice_exercises(id, position, prompt, source, hints, model_answer, feedback)";

interface ModuleRow {
  id: string;
  task_type: TaskType;
  title: LocalizedText;
  description: LocalizedText;
  difficulty: Difficulty;
  trains: string[];
  practice_exercises: { id: string }[];
}

interface ExerciseRow {
  id: string;
  position: number;
  prompt: LocalizedText;
  source: string | null;
  hints: LocalizedText[];
  model_answer: string;
  feedback: LocalizedText;
}

interface ModuleDetailRow extends Omit<ModuleRow, "practice_exercises"> {
  intro: LocalizedText;
  practice_exercises: ExerciseRow[];
}

/**
 * Row → summary. `trains` is renamed through `normaliseCriterionCode`: the DB spells
 * grammar `GRAMMATICAL_RANGE_ACCURACY`, the frontend `GRAMMATICAL_RANGE`. Skipping this
 * leaves `criterionLabel()` looking up a code with no label and `recommendedModuleFor()`
 * never matching it — silent, not a crash.
 *
 * `v_practice_progress` is an inner join, so a module with zero attempts has no row in
 * it at all; `completed` defaults to 0 for exactly that reason, not as a fallback for an
 * error.
 */
function toSummaryFromRow(
  row: ModuleRow,
  locale: Locale,
  completed: number,
): PracticeModuleSummary {
  const exerciseCount = row.practice_exercises.length;
  return {
    id: row.id,
    task_type: row.task_type,
    title: text(row.title, locale),
    description: text(row.description, locale),
    difficulty: row.difficulty,
    exercise_count: exerciseCount,
    completed_count: Math.min(completed, exerciseCount),
    trains: row.trains.map(normaliseCriterionCode),
  };
}

export async function listModules(
  taskType: TaskType,
  locale: Locale,
): Promise<PracticeModuleSummary[]> {
  if (!isSupabaseConfigured) {
    await delay(LATENCY.read);
    const progress = getModuleProgress();
    return PRACTICE_MODULES.filter((candidate) => candidate.task_type === taskType).map(
      (candidate) => summarise(candidate, locale, progress),
    );
  }

  const client = getSupabaseBrowserClient();
  const [modules, progress] = await Promise.all([
    client
      .from("practice_modules")
      .select(MODULE_SELECT)
      .eq("task_type", taskType)
      .order("position"),
    client.from("v_practice_progress").select("module_id, completed_count"),
  ]);
  if (modules.error) throw toApiError(modules.error);
  if (progress.error) throw toApiError(progress.error);

  const byModule = new Map((progress.data ?? []).map((row) => [row.module_id, row.completed_count]));
  return (modules.data ?? []).map((row) =>
    toSummaryFromRow(row, locale, byModule.get(row.id) ?? 0),
  );
}

export async function getModule(
  id: string,
  locale: Locale,
): Promise<PracticeModuleDetail> {
  if (!isSupabaseConfigured) {
    await delay(LATENCY.read);
    const practiceModule = findModule(id);
    if (!practiceModule) throw new ApiError("NOT_FOUND", "That practice module does not exist.");

    const progress = getModuleProgress();
    const exercises: PracticeExercise[] = practiceModule.exercises.map((exercise) => ({
      id: exercise.id,
      prompt: text(exercise.prompt, locale),
      source: exercise.source ?? null,
      hints: textList(exercise.hints, locale),
      model_answer: exercise.model_answer,
      feedback: text(exercise.feedback, locale),
    }));

    return {
      ...summarise(practiceModule, locale, progress),
      intro: text(practiceModule.intro, locale),
      exercises,
    };
  }

  const client = getSupabaseBrowserClient();
  const [moduleResult, progressResult] = await Promise.all([
    client.from("practice_modules").select(MODULE_DETAIL_SELECT).eq("id", id).maybeSingle(),
    client
      .from("v_practice_progress")
      .select("completed_count")
      .eq("module_id", id)
      .maybeSingle(),
  ]);
  if (moduleResult.error) throw toApiError(moduleResult.error);
  if (progressResult.error) throw toApiError(progressResult.error);
  const row = moduleResult.data as ModuleDetailRow | null;
  if (!row) throw new ApiError("NOT_FOUND", "That practice module does not exist.");

  const exercises: PracticeExercise[] = [...row.practice_exercises]
    .sort((a, b) => a.position - b.position)
    .map((exercise) => ({
      id: exercise.id,
      prompt: text(exercise.prompt, locale),
      source: exercise.source,
      hints: textList(exercise.hints, locale),
      model_answer: exercise.model_answer,
      feedback: text(exercise.feedback, locale),
    }));

  return {
    ...toSummaryFromRow(row, locale, progressResult.data?.completed_count ?? 0),
    intro: text(row.intro, locale),
    exercises,
  };
}

/** Words worth noticing when a learner claims to have paraphrased something. */
const STOP_WORDS = new Set([
  "the", "a", "an", "of", "in", "on", "and", "or", "to", "for", "is", "are", "was",
  "were", "by", "with", "at", "from", "that", "this", "it", "as", "be", "has", "have",
]);

const SUBORDINATORS = [
  "although", "though", "while", "whereas", "because", "since", "unless", "which",
  "who", "whose", "if", "when", "despite", "making", "leading",
];

function contentWords(value: string): string[] {
  return (value.toLowerCase().match(/\b[\w'-]+\b/g) ?? []).filter(
    (word) => word.length > 3 && !STOP_WORDS.has(word),
  );
}

/**
 * Observations, in order of usefulness.
 *
 * Capped at three: a learner who is given six notes about one sentence acts on none of
 * them.
 */
function observations(
  answer: string,
  exercise: { source?: string | null; model_answer: string },
  locale: Locale,
): string[] {
  const notes: MessageKey[] = [];
  const answerWords = contentWords(answer);
  const modelWords = countWords(exercise.model_answer);
  const answerCount = countWords(answer);

  if (exercise.source) {
    const sourceWords = new Set(contentWords(exercise.source));
    const reused = answerWords.filter((word) => sourceWords.has(word));
    const reuseRatio = answerWords.length > 0 ? reused.length / answerWords.length : 0;
    notes.push(reuseRatio > 0.45 ? "practiceNote.copiedWords" : "practiceNote.freshWording");
  }

  if (answerCount < modelWords * 0.5) {
    notes.push("practiceNote.lengthShort");
  } else if (answerCount > modelWords * 1.8) {
    notes.push("practiceNote.lengthLong");
  } else {
    notes.push("practiceNote.lengthGood");
  }

  const lower = answer.toLowerCase();
  notes.push(
    SUBORDINATORS.some((word) => lower.includes(word))
      ? "practiceNote.subordinationUsed"
      : "practiceNote.noSubordination",
  );

  return notes.slice(0, 3).map((key) => translate(locale, key));
}

export async function checkAnswer(
  attempt: PracticeAttempt,
  locale: Locale,
): Promise<PracticeFeedback> {
  if (!isSupabaseConfigured) {
    await delay(LATENCY.write);

    const practiceModule = findModule(attempt.module_id);
    const exercise = practiceModule?.exercises.find((item) => item.id === attempt.exercise_id);
    if (!practiceModule || !exercise) {
      throw new ApiError("NOT_FOUND", "That exercise does not exist.");
    }

    return {
      exercise_id: exercise.id,
      notes: observations(attempt.answer, exercise, locale),
      model_answer: exercise.model_answer,
      feedback: text(exercise.feedback, locale),
    };
  }

  const client = getSupabaseBrowserClient();
  const { data: exercise, error: exerciseError } = await client
    .from("practice_exercises")
    .select("id, source, model_answer, feedback")
    .eq("id", attempt.exercise_id)
    .eq("module_id", attempt.module_id)
    .maybeSingle();
  if (exerciseError) throw toApiError(exerciseError);
  if (!exercise) throw new ApiError("NOT_FOUND", "That exercise does not exist.");

  const feedback: PracticeFeedback = {
    exercise_id: exercise.id,
    notes: observations(attempt.answer, exercise, locale),
    model_answer: exercise.model_answer,
    feedback: text(exercise.feedback as LocalizedText, locale),
  };

  // Recorded as part of checking rather than in `recordProgress`: this is the one call
  // that already has the learner's answer text in hand, and `practice_attempts` needs
  // it. `v_practice_progress` (an inner join over these rows) reflects the insert
  // immediately, so nothing separate has to "set" a progress counter afterward.
  //
  // `getSession()` reads the cookie-backed session already attached to this client
  // rather than round-tripping to the auth server: the value only fills in a column,
  // RLS re-verifies `user_id = auth.uid()` server-side regardless of what's sent here.
  const {
    data: { session },
  } = await client.auth.getSession();
  if (!session) throw new ApiError("SESSION_EXPIRED", "Sign in again to save your progress.");

  const { error: insertError } = await client.from("practice_attempts").insert({
    user_id: session.user.id,
    module_id: attempt.module_id,
    exercise_id: attempt.exercise_id,
    answer: attempt.answer,
  });
  if (insertError) throw toApiError(insertError);

  return feedback;
}

/**
 * Record how far through a module the learner has reached.
 *
 * Takes a count rather than an increment so a learner who re-runs exercise 1 of a
 * finished module does not walk their progress backwards.
 *
 * Under Supabase this is a no-op: `checkAnswer` already inserted the real
 * `practice_attempts` row, and `v_practice_progress` derives the count from it — there
 * is nothing left to set.
 */
export async function recordProgress(
  moduleId: string,
  completedCount: number,
): Promise<void> {
  if (isSupabaseConfigured) return;
  setModuleProgress(moduleId, completedCount);
  recordPracticeSession(moduleId, completedCount);
}

/**
 * The module to send a learner to for a given criterion.
 *
 * Prefers a module that trains only that criterion — a focused drill beats a broad one
 * when the learner has been told exactly what is weakest.
 */
export function recommendedModuleFor(
  taskType: TaskType,
  code: CriterionCode,
): string | null {
  const candidates = PRACTICE_MODULES.filter(
    (candidate) => candidate.task_type === taskType && candidate.trains.includes(code),
  );
  if (candidates.length === 0) return null;
  const focused = candidates.find((candidate) => candidate.trains.length === 1);
  return (focused ?? candidates[0]).id;
}
