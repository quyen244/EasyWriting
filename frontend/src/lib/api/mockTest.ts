/**
 * Mock test calls.
 *
 * Submitting produces a full `GradingResult` per task — the same shape the grader
 * returns — so the result screen has one implementation rather than two. The combined
 * band is derived with the exam's own weighting rather than averaged.
 */

import type { Locale } from "@/lib/i18n";
import { DEFAULT_MOCK_TEST, MOCK_TESTS } from "@/mockData/mockTests";

import { gradeMockSubmission } from "./grading";
import { combinedWritingBand } from "./insights";
import { LATENCY, delay, recordMockAttempt } from "./store";
import {
  ApiError,
  type GradeInput,
  type MockTest,
  type MockTestResult,
  type MockTestSubmission,
} from "./types";

export async function listMockTests(): Promise<MockTest[]> {
  await delay(LATENCY.read);
  return MOCK_TESTS;
}

export async function getMockTest(id?: string): Promise<MockTest> {
  await delay(LATENCY.read);
  if (!id) return DEFAULT_MOCK_TEST;
  const test = MOCK_TESTS.find((candidate) => candidate.id === id);
  if (!test) throw new ApiError("NOT_FOUND", "That test does not exist.");
  return test;
}

/**
 * Grade a submitted test.
 *
 * An empty answer is graded rather than rejected: running out of time with Task 2 blank
 * is a real exam outcome, and the learner needs to see what that costs.
 */
export async function submitMockTest(
  submission: MockTestSubmission,
  locale: Locale,
): Promise<MockTestResult> {
  const test = MOCK_TESTS.find((candidate) => candidate.id === submission.test_id);
  if (!test) throw new ApiError("NOT_FOUND", "That test does not exist.");

  const inputs: GradeInput[] = test.tasks.map((task) => {
    const answer = submission.answers[task.task_type] ?? "";
    if (task.task_type === "TASK_1") {
      return {
        task_type: "TASK_1",
        prompt_text: task.prompt,
        // The exam's own answer sheet is one box, so the three-part split the grader
        // offers does not apply here. The whole answer is the body.
        introduction: "",
        overview: "",
        body: answer,
        chart_description: task.stimulus ?? null,
        has_chart_image: false,
      };
    }
    return { task_type: "TASK_2", prompt_text: task.prompt, essay_text: answer };
  });

  const results = await gradeMockSubmission(inputs, locale);
  const submittedAt = new Date().toISOString();
  const attemptId = `mock_${Date.now().toString(36)}`;

  recordMockAttempt({
    id: attemptId,
    test_id: test.id,
    submitted_at: submittedAt,
    attempt_ids: results.map((result) => result.id),
  });

  return {
    id: attemptId,
    test_id: test.id,
    results,
    combined_band: combinedWritingBand(results),
    submitted_at: submittedAt,
  };
}
