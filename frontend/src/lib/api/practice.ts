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
import { PRACTICE_MODULES, findModule } from "@/mockData/practice";
import { text, textList } from "@/mockData/localized";

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
  type PracticeAttempt,
  type PracticeExercise,
  type PracticeFeedback,
  type PracticeModuleDetail,
  type PracticeModuleSummary,
  type TaskType,
} from "./types";

function summarise(
  module: (typeof PRACTICE_MODULES)[number],
  locale: Locale,
  progress: Record<string, number>,
): PracticeModuleSummary {
  return {
    id: module.id,
    task_type: module.task_type,
    title: text(module.title, locale),
    description: text(module.description, locale),
    difficulty: module.difficulty,
    exercise_count: module.exercises.length,
    completed_count: Math.min(progress[module.id] ?? 0, module.exercises.length),
    trains: module.trains,
  };
}

export async function listModules(
  taskType: TaskType,
  locale: Locale,
): Promise<PracticeModuleSummary[]> {
  await delay(LATENCY.read);
  const progress = getModuleProgress();
  return PRACTICE_MODULES.filter((module) => module.task_type === taskType).map((module) =>
    summarise(module, locale, progress),
  );
}

export async function getModule(
  id: string,
  locale: Locale,
): Promise<PracticeModuleDetail> {
  await delay(LATENCY.read);
  const module = findModule(id);
  if (!module) throw new ApiError("NOT_FOUND", "That practice module does not exist.");

  const progress = getModuleProgress();
  const exercises: PracticeExercise[] = module.exercises.map((exercise) => ({
    id: exercise.id,
    prompt: text(exercise.prompt, locale),
    source: exercise.source ?? null,
    hints: textList(exercise.hints, locale),
    model_answer: exercise.model_answer,
    feedback: text(exercise.feedback, locale),
  }));

  return { ...summarise(module, locale, progress), intro: text(module.intro, locale), exercises };
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
  await delay(LATENCY.write);

  const module = findModule(attempt.module_id);
  const exercise = module?.exercises.find((item) => item.id === attempt.exercise_id);
  if (!module || !exercise) {
    throw new ApiError("NOT_FOUND", "That exercise does not exist.");
  }

  return {
    exercise_id: exercise.id,
    notes: observations(attempt.answer, exercise, locale),
    model_answer: exercise.model_answer,
    feedback: text(exercise.feedback, locale),
  };
}

/**
 * Record how far through a module the learner has reached.
 *
 * Takes a count rather than an increment so a learner who re-runs exercise 1 of a
 * finished module does not walk their progress backwards.
 */
export async function recordProgress(
  moduleId: string,
  completedCount: number,
): Promise<void> {
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
    (module) => module.task_type === taskType && module.trains.includes(code),
  );
  if (candidates.length === 0) return null;
  const focused = candidates.find((module) => module.trains.length === 1);
  return (focused ?? candidates[0]).id;
}
