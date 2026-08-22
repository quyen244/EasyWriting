/**
 * Full Writing tests: Task 1 and Task 2, one hour, as the real exam sets them.
 *
 * The stimulus is text rather than an image on purpose. A generated chart image would
 * have to be legible at every breakpoint and in both themes, and an unreadable chart in
 * an exam simulation is worse than no chart — the learner cannot answer the question.
 * Text data is readable everywhere and is what the grader receives anyway.
 */

import type { MockTest } from "@/lib/api/types";

import { TASK_1_PROMPTS } from "./task1";
import { TASK_2_PROMPTS } from "./task2";

export const MOCK_TESTS: MockTest[] = [
  {
    id: "mock_writing_01",
    title: "Academic Writing — Test 1",
    duration_minutes: 60,
    tasks: [
      {
        task_type: "TASK_1",
        prompt: TASK_1_PROMPTS[1].prompt,
        stimulus: TASK_1_PROMPTS[1].stimulus,
        stimulus_caption: TASK_1_PROMPTS[1].stimulus_caption,
        min_words: 150,
        suggested_minutes: 20,
      },
      {
        task_type: "TASK_2",
        prompt: TASK_2_PROMPTS[2].prompt,
        min_words: 250,
        suggested_minutes: 40,
      },
    ],
  },
  {
    id: "mock_writing_02",
    title: "Academic Writing — Test 2",
    duration_minutes: 60,
    tasks: [
      {
        task_type: "TASK_1",
        prompt: TASK_1_PROMPTS[2].prompt,
        stimulus: TASK_1_PROMPTS[2].stimulus,
        stimulus_caption: TASK_1_PROMPTS[2].stimulus_caption,
        min_words: 150,
        suggested_minutes: 20,
      },
      {
        task_type: "TASK_2",
        prompt: TASK_2_PROMPTS[3].prompt,
        min_words: 250,
        suggested_minutes: 40,
      },
    ],
  },
];

export const DEFAULT_MOCK_TEST = MOCK_TESTS[0];
