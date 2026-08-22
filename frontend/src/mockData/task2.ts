/**
 * Task 2 material: essay questions.
 *
 * English only in every locale, for the same reason Task 1's prompts are — see `task1.ts`.
 * The mix is deliberate: an opinion question, a discuss-both-views, a problem/solution
 * and a two-part question, because they are the four shapes the exam actually sets and
 * each rewards a different essay structure.
 */

export interface Task2Prompt {
  id: string;
  /** The question type, shown to the learner as context. */
  kind: "opinion" | "discussion" | "problem_solution" | "two_part";
  prompt: string;
}

export const TASK_2_PROMPTS: Task2Prompt[] = [
  {
    id: "t2_remote_work",
    kind: "opinion",
    prompt:
      "Some people believe that working from home benefits both employees and employers, while others argue that it damages collaboration and career development. To what extent do you agree or disagree?",
  },
  {
    id: "t2_technology_children",
    kind: "discussion",
    prompt:
      "Some people think that children should begin using computers and tablets as early as possible, while others believe this should be delayed until secondary school. Discuss both views and give your own opinion.",
  },
  {
    id: "t2_city_traffic",
    kind: "problem_solution",
    prompt:
      "Traffic congestion is becoming worse in many major cities. What are the causes of this problem, and what measures could be taken to solve it?",
  },
  {
    id: "t2_free_university",
    kind: "two_part",
    prompt:
      "In many countries, university education is funded by the government. Why do some governments choose to fund it? Is this the best use of public money?",
  },
];

export const DEFAULT_TASK_2_PROMPT = TASK_2_PROMPTS[0];
