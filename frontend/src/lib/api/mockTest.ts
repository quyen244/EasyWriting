/**
 * Mock test calls.
 *
 * Submitting produces a full `GradingResult` per task — the same shape the grader
 * returns — so the result screen has one implementation rather than two. The combined
 * band is derived with the exam's own weighting rather than averaged.
 */

import type { Locale } from "@/lib/i18n";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { DEFAULT_MOCK_TEST, MOCK_TESTS } from "@/mockData/mockTests";

import { gradeMockSubmission } from "./grading";
import { combinedWritingBand } from "./insights";
import { toApiError } from "./supabase";
import { LATENCY, delay, recordMockAttempt } from "./store";
import {
  ApiError,
  type GradeInput,
  type MockTest,
  type MockTestResult,
  type MockTestSubmission,
  type MockTestTask,
} from "./types";

const MOCK_TEST_SELECT =
  "id, title, duration_minutes, mock_test_tasks(task_type, prompt, stimulus, " +
  "stimulus_caption, min_words, suggested_minutes, position)";

interface MockTestRow {
  id: string;
  title: { en: string; vi: string };
  duration_minutes: number;
  mock_test_tasks: (MockTestTask & { position: number })[];
}

/**
 * Only the English title makes it onto the wire — `MockTest.title` is a plain string,
 * not `{en, vi}`, and neither call site here passes a locale to pick with. The DB does
 * carry a real Vietnamese title (see `scripts/gen-seed.ts`'s `TEST_TITLE_VI`), so this
 * is a stated gap, not settled precedent: localizing test titles is separate work.
 */
function toMockTest(row: MockTestRow): MockTest {
  return {
    id: row.id,
    title: row.title.en,
    duration_minutes: row.duration_minutes,
    tasks: [...row.mock_test_tasks]
      .sort((a, b) => a.position - b.position)
      .map(({ position: _position, ...task }) => task),
  };
}

export async function listMockTests(): Promise<MockTest[]> {
  if (!isSupabaseConfigured) {
    await delay(LATENCY.read);
    return MOCK_TESTS;
  }
  const client = getSupabaseBrowserClient();
  const { data, error } = await client
    .from("mock_tests")
    .select(MOCK_TEST_SELECT)
    .order("position")
    .returns<MockTestRow[]>();
  if (error) throw toApiError(error);
  return (data ?? []).map(toMockTest);
}

export async function getMockTest(id?: string): Promise<MockTest> {
  if (!isSupabaseConfigured) {
    await delay(LATENCY.read);
    if (!id) return DEFAULT_MOCK_TEST;
    const test = MOCK_TESTS.find((candidate) => candidate.id === id);
    if (!test) throw new ApiError("NOT_FOUND", "That test does not exist.");
    return test;
  }

  const client = getSupabaseBrowserClient();
  const query = client.from("mock_tests").select(MOCK_TEST_SELECT);
  const { data, error } = id
    ? await query.eq("id", id).returns<MockTestRow[]>().maybeSingle()
    : await query.order("position").limit(1).returns<MockTestRow[]>().maybeSingle();
  if (error) throw toApiError(error);
  if (!data) throw new ApiError("NOT_FOUND", "That test does not exist.");
  return toMockTest(data);
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
