/**
 * The wire shapes every authenticated screen is built against.
 *
 * These are the *response* shapes — what a real API would return — not view models. The
 * distinction matters: when Supabase replaces the mock transport, this file should not
 * need to change, because nothing here describes how a component wants to render.
 *
 * Two conventions carried over from the existing assessments client:
 *  - snake_case fields, because that is what the service speaks.
 *  - Criterion codes, not labels, are the identity. Labels are looked up in the UI's own
 *    catalogue so a missing or odd server label can never produce an unlabelled score.
 */

export type TaskType = "TASK_1" | "TASK_2";

/**
 * The five criterion codes, of which any one result carries exactly four.
 *
 * `TASK_ACHIEVEMENT` and `TASK_RESPONSE` are mutually exclusive: Task 1 is scored on how
 * completely the data was reported, Task 2 on how fully the question was answered. A
 * result that carried both would be describing an exam that does not exist.
 */
export type CriterionCode =
  | "TASK_ACHIEVEMENT"
  | "TASK_RESPONSE"
  | "COHERENCE_COHESION"
  | "LEXICAL_RESOURCE"
  | "GRAMMATICAL_RANGE";

/** The criteria a task is scored on, in the order a result presents them. */
export const CRITERIA_BY_TASK: Record<TaskType, CriterionCode[]> = {
  TASK_1: [
    "TASK_ACHIEVEMENT",
    "COHERENCE_COHESION",
    "LEXICAL_RESOURCE",
    "GRAMMATICAL_RANGE",
  ],
  TASK_2: [
    "TASK_RESPONSE",
    "COHERENCE_COHESION",
    "LEXICAL_RESOURCE",
    "GRAMMATICAL_RANGE",
  ],
};

/** Minimum words per task (spec Assumptions, FR-006). */
export const MIN_WORDS: Record<TaskType, number> = {
  TASK_1: 150,
  TASK_2: 250,
};

export const BAND_MAX = 9;

export interface GradingCriterion {
  code: CriterionCode;
  /** Server-supplied label. The UI still prefers its own catalogue. */
  label: string;
  band: number;
  /** Why this band — descriptor-grounded, plain language. */
  comment: string;
  /** What to do about it. One concrete action, not a restatement of the comment. */
  improvement: string;
  /** Verbatim spans from the learner's own writing. May be empty, never invented. */
  evidence_quotes: string[];
}

export interface GradingResult {
  id: string;
  task_type: TaskType;
  status: "scored";
  overall_band: number;
  /** Always four, and always the four `CRITERIA_BY_TASK` names for `task_type`. */
  criteria: GradingCriterion[];
  word_count: number;
  min_words: number;
  length_penalty: number;
  provisional: boolean;
  pipeline_version: string;
  model_id: string;
  created_at: string;
  scored_at: string;
  /** Echoed back so a stored result can be reopened, retried, or revised. */
  prompt_text?: string | null;
  essay_text?: string;
}

export interface GradeTask2Input {
  task_type: "TASK_2";
  prompt_text?: string | null;
  essay_text: string;
}

export interface GradeTask1Input {
  task_type: "TASK_1";
  prompt_text?: string | null;
  /** Introduction / Overview / Body, kept apart because examiners score them apart. */
  introduction: string;
  overview: string;
  body: string;
  /** Typed description of the chart. Either this or an image satisfies the stimulus. */
  chart_description?: string | null;
  /** Whether an image was attached. The file itself never leaves the browser here. */
  has_chart_image: boolean;
}

export type GradeInput = GradeTask1Input | GradeTask2Input;

// ── Practice ──────────────────────────────────────────────────────────────────

export type Difficulty = "foundation" | "intermediate" | "advanced";

export interface PracticeModuleSummary {
  id: string;
  task_type: TaskType;
  title: string;
  /** One line — enough to choose from a list without opening it. */
  description: string;
  difficulty: Difficulty;
  exercise_count: number;
  completed_count: number;
  /** The criteria this module trains. Drives the result → practice handoff. */
  trains: CriterionCode[];
}

export interface PracticeExercise {
  id: string;
  /** What the learner is asked to do. */
  prompt: string;
  /** Material to work from — an original sentence, a question, a set of figures. */
  source?: string | null;
  /** Shown before answering: what a good answer does. */
  hints: string[];
  model_answer: string;
  /** Shown after answering, alongside the model answer. */
  feedback: string;
}

export interface PracticeModuleDetail extends PracticeModuleSummary {
  /** Longer framing shown at the top of the module. */
  intro: string;
  exercises: PracticeExercise[];
}

export interface PracticeAttempt {
  module_id: string;
  exercise_id: string;
  answer: string;
}

export interface PracticeFeedback {
  exercise_id: string;
  /** Observations about the learner's own answer. Never a band. */
  notes: string[];
  model_answer: string;
  feedback: string;
}

// ── Mock test ─────────────────────────────────────────────────────────────────

export interface MockTestTask {
  task_type: TaskType;
  prompt: string;
  /** Task 1 only: the data to report on, as text. */
  stimulus?: string | null;
  stimulus_caption?: string | null;
  min_words: number;
  suggested_minutes: number;
}

export interface MockTest {
  id: string;
  title: string;
  duration_minutes: number;
  tasks: MockTestTask[];
}

export interface MockTestSubmission {
  test_id: string;
  answers: Record<TaskType, string>;
  /** Seconds actually spent, for the record; not scored. */
  elapsed_seconds: number;
}

export interface MockTestResult {
  id: string;
  test_id: string;
  /** One full grading result per task — the same shape the grader returns. */
  results: GradingResult[];
  /** Task 2 weighted double, as the real test weights it. */
  combined_band: number;
  submitted_at: string;
}

// ── Account ───────────────────────────────────────────────────────────────────

export type HistorySource = "grader" | "mock_test";

export interface HistoryEntry {
  id: string;
  /** The stored result this row opens. */
  result_id: string;
  task_type: TaskType;
  /** Enough of the prompt to recognise the essay. */
  prompt_excerpt: string;
  overall_band: number;
  word_count: number;
  provisional: boolean;
  source: HistorySource;
  created_at: string;
}

export interface CriterionAverage {
  code: CriterionCode;
  average: number;
  /** How many graded submissions this average is drawn from. */
  sample_size: number;
}

export interface WeeklyVolume {
  /** ISO date of the week's Monday. */
  week_start: string;
  words: number;
  submissions: number;
}

export interface ProgressSummary {
  overall_average: number | null;
  task1_average: number | null;
  task2_average: number | null;
  /** Latest band minus the mean of everything before it. Null until there is a before. */
  recent_change: number | null;
  strongest: CriterionAverage | null;
  weakest: CriterionAverage | null;
  criterion_averages: CriterionAverage[];
  /** Oldest first — a trend read left to right. */
  band_trend: { date: string; band: number; task_type: TaskType; result_id: string }[];
  weekly_volume: WeeklyVolume[];
  /** ISO dates, most recent last, on which the learner did anything at all. */
  active_days: string[];
  total_words: number;
  total_submissions: number;
}

export type ActivityKind = "graded" | "practice" | "mock_test";

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  at: string;
  /** Where this row goes when clicked. */
  href: string;
  task_type?: TaskType;
  module_id?: string;
  module_title?: string;
  band?: number;
  /** Practice only: how far through the module this attempt left the learner. */
  progress?: { done: number; total: number };
}

// ── Errors ────────────────────────────────────────────────────────────────────

export type ApiErrorCode =
  | "BELOW_MIN_WORDS"
  | "UNSCOREABLE"
  | "SCORING_FAILED"
  | "NOT_FOUND"
  | "SESSION_EXPIRED";

/**
 * A documented failure.
 *
 * `minimum_words` rides along only on `BELOW_MIN_WORDS`, because that is the one case
 * where the learner needs a number to act on.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly minimumWords?: number;

  constructor(code: ApiErrorCode, message: string, minimumWords?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.minimumWords = minimumWords;
  }

  /** True when the learner can fix this by editing what they wrote. */
  get isRecoverableByEditing(): boolean {
    return this.code === "BELOW_MIN_WORDS" || this.code === "UNSCOREABLE";
  }

  /** True when resubmitting the identical text may succeed. */
  get isRetryable(): boolean {
    return this.code === "SCORING_FAILED";
  }
}

/** Word count for the client-side hint. The server's count is authoritative. */
export function countWords(text: string): number {
  const matches = text.match(/\b[\w'-]+\b/g);
  return matches ? matches.length : 0;
}

/** Bands are reported in half steps; nothing should ever display 6.37. */
export function toHalfBand(value: number): number {
  return Math.round(value * 2) / 2;
}

export function clampBand(value: number): number {
  return Math.min(BAND_MAX, Math.max(0, value));
}
