/**
 * Seeded history: eight graded submissions across roughly ten weeks.
 *
 * Bands are stated per criterion rather than as an overall, and the overall is derived
 * from them by the data client. That is the right way round — an overall band that was
 * itself a fixture could contradict the four numbers printed underneath it.
 *
 * The shape of the data is deliberate, because it is what every chart in the account
 * area has to render legibly:
 *
 *  - the overall trend rises 5.5 → 7.0, with a flat stretch in the middle, so the trend
 *    line has a story rather than a straight slope;
 *  - Lexical Resource is consistently the strongest criterion and Grammatical Range the
 *    weakest, so "strongest / weakest" is unambiguous and the practice handoff always
 *    has somewhere to send the learner;
 *  - both tasks appear, and two of the eight come from a mock test rather than the
 *    grader, so the history's `source` column is exercised.
 */

import type { CriterionCode, TaskType } from "@/lib/api/types";

export interface SeededAttempt {
  id: string;
  task_type: TaskType;
  prompt: string;
  /** Verbatim spans, treated as the learner's own writing when a result is rebuilt. */
  evidence: string[];
  bands: Record<CriterionCode, number> | Partial<Record<CriterionCode, number>>;
  word_count: number;
  created_at: string;
  source: "grader" | "mock_test";
  provisional: boolean;
}

export const SEEDED_ATTEMPTS: SeededAttempt[] = [
  {
    id: "sub_20260608_a",
    task_type: "TASK_2",
    prompt:
      "Some people believe that working from home benefits both employees and employers, while others argue that it damages collaboration and career development. To what extent do you agree or disagree?",
    evidence: [
      "In my opinion, working from home is good for employees and also for companies.",
      "Many workers save a lot of time because they do not travel to the office every day.",
    ],
    bands: {
      TASK_RESPONSE: 5.5,
      COHERENCE_COHESION: 5.5,
      LEXICAL_RESOURCE: 6.0,
      GRAMMATICAL_RANGE: 5.0,
    },
    word_count: 238,
    created_at: "2026-06-08T13:24:00.000Z",
    source: "grader",
    provisional: false,
  },
  {
    id: "sub_20260615_a",
    task_type: "TASK_1",
    prompt:
      "The chart below shows the percentage of electricity generated from coal, natural gas and renewable sources in four countries in 2010 and 2020.",
    evidence: [
      "The chart gives information about electricity production in four different countries.",
      "Coal decreased in every country, especially in Country A where it fell to 31 per cent.",
    ],
    bands: {
      TASK_ACHIEVEMENT: 6.0,
      COHERENCE_COHESION: 5.5,
      LEXICAL_RESOURCE: 6.0,
      GRAMMATICAL_RANGE: 5.0,
    },
    word_count: 164,
    created_at: "2026-06-15T08:41:00.000Z",
    source: "grader",
    provisional: false,
  },
  {
    id: "sub_20260624_a",
    task_type: "TASK_2",
    prompt:
      "Traffic congestion is becoming worse in many major cities. What are the causes of this problem, and what measures could be taken to solve it?",
    evidence: [
      "The main cause of congestion is that private car ownership has risen faster than road capacity.",
      "Governments could invest in metro systems, which move far more people per hour than roads do.",
    ],
    bands: {
      TASK_RESPONSE: 6.0,
      COHERENCE_COHESION: 6.0,
      LEXICAL_RESOURCE: 6.5,
      GRAMMATICAL_RANGE: 5.5,
    },
    word_count: 271,
    created_at: "2026-06-24T19:02:00.000Z",
    source: "grader",
    provisional: false,
  },
  {
    id: "sub_20260705_t1",
    task_type: "TASK_1",
    prompt:
      "The graph below shows how people in a European city travelled to work between 2000 and 2020.",
    evidence: [
      "The line graph compares four ways of commuting in one European city over two decades.",
      "Overall, car use declined steadily while cycling and public transport both grew.",
    ],
    bands: {
      TASK_ACHIEVEMENT: 6.0,
      COHERENCE_COHESION: 6.0,
      LEXICAL_RESOURCE: 6.5,
      GRAMMATICAL_RANGE: 5.5,
    },
    word_count: 178,
    created_at: "2026-07-05T02:15:00.000Z",
    source: "mock_test",
    provisional: false,
  },
  {
    id: "sub_20260705_t2",
    task_type: "TASK_2",
    prompt:
      "Some people think that children should begin using computers and tablets as early as possible, while others believe this should be delayed until secondary school.",
    evidence: [
      "Those who favour early exposure argue that digital skills are now as basic as literacy.",
      "However, there is evidence that unstructured screen time displaces the play young children need.",
    ],
    bands: {
      TASK_RESPONSE: 6.0,
      COHERENCE_COHESION: 6.5,
      LEXICAL_RESOURCE: 6.5,
      GRAMMATICAL_RANGE: 5.5,
    },
    word_count: 284,
    created_at: "2026-07-05T02:58:00.000Z",
    source: "mock_test",
    provisional: false,
  },
  {
    id: "sub_20260719_a",
    task_type: "TASK_2",
    prompt:
      "In many countries, university education is funded by the government. Why do some governments choose to fund it? Is this the best use of public money?",
    evidence: [
      "Governments fund universities because an educated workforce raises long-term tax revenue.",
      "Whether this is the best use of public money depends on what the alternative spending would achieve.",
    ],
    bands: {
      TASK_RESPONSE: 6.5,
      COHERENCE_COHESION: 6.0,
      LEXICAL_RESOURCE: 7.0,
      GRAMMATICAL_RANGE: 6.0,
    },
    word_count: 293,
    created_at: "2026-07-19T14:37:00.000Z",
    source: "grader",
    provisional: false,
  },
  {
    id: "sub_20260802_a",
    task_type: "TASK_1",
    prompt:
      "The pie charts below show household water consumption in two countries.",
    evidence: [
      "The two pie charts break down domestic water use in Country X and Country Y.",
      "The most striking contrast lies in garden watering, which accounts for 38 per cent in Country Y but only 11 per cent in Country X.",
    ],
    bands: {
      TASK_ACHIEVEMENT: 6.5,
      COHERENCE_COHESION: 6.5,
      LEXICAL_RESOURCE: 7.0,
      GRAMMATICAL_RANGE: 6.0,
    },
    word_count: 186,
    created_at: "2026-08-02T10:05:00.000Z",
    source: "grader",
    provisional: false,
  },
  {
    id: "sub_20260812_a",
    task_type: "TASK_2",
    prompt:
      "Some people believe that working from home benefits both employees and employers, while others argue that it damages collaboration and career development. To what extent do you agree or disagree?",
    evidence: [
      "While remote work undeniably suits established teams, it places new entrants at a measurable disadvantage.",
      "What the evidence actually shows is that outcomes depend far more on management practice than on location.",
    ],
    bands: {
      TASK_RESPONSE: 7.0,
      COHERENCE_COHESION: 6.5,
      LEXICAL_RESOURCE: 7.5,
      GRAMMATICAL_RANGE: 6.0,
    },
    word_count: 301,
    created_at: "2026-08-12T16:48:00.000Z",
    source: "grader",
    provisional: false,
  },
];

/** Practice sessions, for the activity stream and the consistency grid. */
export interface SeededPracticeSession {
  id: string;
  module_id: string;
  at: string;
  completed: number;
}

export const SEEDED_PRACTICE_SESSIONS: SeededPracticeSession[] = [
  { id: "prc_1", module_id: "t2_paraphrase_question", at: "2026-08-18T12:30:00.000Z", completed: 2 },
  { id: "prc_2", module_id: "t2_complex_sentences", at: "2026-08-16T09:10:00.000Z", completed: 1 },
  { id: "prc_3", module_id: "t1_write_overview", at: "2026-08-14T20:05:00.000Z", completed: 3 },
  { id: "prc_4", module_id: "t2_complex_sentences", at: "2026-08-11T18:22:00.000Z", completed: 1 },
  { id: "prc_5", module_id: "t2_essay_outline", at: "2026-08-06T07:44:00.000Z", completed: 2 },
  { id: "prc_6", module_id: "t1_paraphrase_introduction", at: "2026-07-29T13:15:00.000Z", completed: 3 },
];

/** Where the seeded learner has got to in each module they have opened. */
export const SEEDED_MODULE_PROGRESS: Record<string, number> = {
  t1_paraphrase_introduction: 3,
  t1_write_overview: 3,
  t2_paraphrase_question: 2,
  t2_essay_outline: 2,
  t2_complex_sentences: 2,
};

/** The one completed mock test, matching the two `mock_test` attempts above. */
export const SEEDED_MOCK_ATTEMPTS = [
  {
    id: "mock_20260705",
    test_id: "mock_writing_01",
    submitted_at: "2026-07-05T03:02:00.000Z",
    attempt_ids: ["sub_20260705_t1", "sub_20260705_t2"],
  },
];
