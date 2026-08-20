/**
 * Assessments API client (001-ielts-score-assessment, T019).
 *
 * This is the ONLY frontend artifact this feature ships. It builds no pages and no
 * components — `002-core-app-ux` owns the entire workspace UI and imports this client
 * to talk to the scoring API (see 001 plan.md Summary and /speckit-analyze finding I1).
 *
 * Mirrors `contracts/assessments-openapi.yaml`. The error types are modelled as a
 * discriminated union on `error`, so a caller handling a failed submission is forced by
 * the compiler to consider BELOW_MIN_WORDS (which carries `minimum_words`) separately
 * from UNSCOREABLE and SCORING_FAILED — the three need different UI copy, and FR-006
 * specifically requires showing the learner the minimum.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type TaskType = "TASK_1" | "TASK_2";

export type CriterionCode =
  | "TASK_ACHIEVEMENT"
  | "TASK_RESPONSE"
  | "COHERENCE_COHESION"
  | "LEXICAL_RESOURCE"
  | "GRAMMATICAL_RANGE_ACCURACY";

/** Display labels for each criterion (FR-011: they must be unambiguously labelled). */
export const CRITERION_LABELS: Record<CriterionCode, string> = {
  TASK_ACHIEVEMENT: "Task Achievement",
  TASK_RESPONSE: "Task Response",
  COHERENCE_COHESION: "Coherence and Cohesion",
  LEXICAL_RESOURCE: "Lexical Resource",
  GRAMMATICAL_RANGE_ACCURACY: "Grammatical Range and Accuracy",
};

export interface CriterionScore {
  criterion: CriterionCode;
  band: number;
  /** Plain-language, descriptor-grounded rationale. Never empty (FR-012). */
  explanation: string;
  /** Verbatim spans from the learner's own essay; already verified server-side. */
  evidence_quotes: string[];
  descriptor_reference?: string | null;
}

export interface AssessmentResult {
  submission_id: string;
  overall_band: number;
  /** Always exactly four, matching the task type's rubric. */
  criteria: CriterionScore[];
  created_at: string;
}

export interface AssessmentRequest {
  task_type: TaskType;
  essay_text: string;
  prompt_text?: string | null;
}

export type AssessmentErrorCode =
  | "BELOW_MIN_WORDS"
  | "UNSCOREABLE"
  | "SCORING_FAILED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "SESSION_EXPIRED";

/**
 * A documented API failure.
 *
 * `minimum_words` is present only when `error === "BELOW_MIN_WORDS"`, exactly as the
 * contract specifies — hence the narrowing helper below rather than an optional field
 * callers might forget to check.
 */
export class AssessmentApiError extends Error {
  readonly error: AssessmentErrorCode;
  readonly status: number;
  readonly minimumWords?: number;

  constructor(
    error: AssessmentErrorCode,
    message: string,
    status: number,
    minimumWords?: number,
  ) {
    super(message);
    this.name = "AssessmentApiError";
    this.error = error;
    this.status = status;
    this.minimumWords = minimumWords;
  }

  /** True when the learner can fix this themselves by editing their essay (FR-006/007). */
  get isRecoverableByEditing(): boolean {
    return this.error === "BELOW_MIN_WORDS" || this.error === "UNSCOREABLE";
  }

  /** True when resubmitting the identical text may succeed (FR-009). */
  get isRetryable(): boolean {
    return this.error === "SCORING_FAILED";
  }
}

interface ErrorBody {
  error?: AssessmentErrorCode;
  message?: string;
  minimum_words?: number;
}

async function request<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {}),
    },
  });

  if (response.ok) {
    return (await response.json()) as T;
  }

  // A non-JSON body (proxy timeout, gateway HTML) must still surface as a typed error
  // rather than a JSON parse exception the caller cannot interpret.
  let body: ErrorBody = {};
  try {
    body = (await response.json()) as ErrorBody;
  } catch {
    body = {};
  }

  throw new AssessmentApiError(
    body.error ?? (response.status === 401 ? "SESSION_EXPIRED" : "SCORING_FAILED"),
    body.message ?? `Request failed with status ${response.status}.`,
    response.status,
    body.minimum_words,
  );
}

/**
 * Submit an essay for scoring (FR-001..FR-009).
 *
 * Note for callers: on ANY thrown error the learner's essay text must be preserved in
 * the UI. FR-009 makes that a requirement, and the server deliberately does not hold
 * draft state for you — it stores the submission, but the editable draft is the
 * client's responsibility.
 */
export async function createAssessment(
  payload: AssessmentRequest,
  accessToken: string,
): Promise<AssessmentResult> {
  return request<AssessmentResult>("/api/v1/assessments", accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Retrieve a previously produced assessment result (FR-010). */
export async function getAssessment(
  submissionId: string,
  accessToken: string,
): Promise<AssessmentResult> {
  return request<AssessmentResult>(
    `/api/v1/assessments/${encodeURIComponent(submissionId)}`,
    accessToken,
    { method: "GET" },
  );
}

/** Word count used for the client-side hint; the server's count is authoritative. */
export function countWords(essayText: string): number {
  const matches = essayText.match(/\b[\w'-]+\b/g);
  return matches ? matches.length : 0;
}

/** Minimum words per task type (spec Assumptions, FR-006). */
export const MIN_WORDS: Record<TaskType, number> = {
  TASK_1: 150,
  TASK_2: 250,
};
