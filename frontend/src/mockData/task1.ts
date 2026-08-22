/**
 * Task 1 material: prompts and the data they describe.
 *
 * English only, in every locale. These are the exam questions themselves — the thing
 * being practised — and a learner who rehearses against a Vietnamese prompt has not
 * rehearsed for the exam.
 */

export interface Task1Prompt {
  id: string;
  prompt: string;
  /** The chart as text, so the task works without an image. */
  stimulus: string;
  stimulus_caption: string;
}

export const TASK_1_PROMPTS: Task1Prompt[] = [
  {
    id: "t1_energy",
    prompt:
      "The chart below shows the percentage of electricity generated from coal, natural gas and renewable sources in four countries in 2010 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    stimulus:
      "Coal — Country A: 62% (2010) → 31% (2020); Country B: 48% → 44%; Country C: 20% → 9%; Country D: 71% → 66%.\n" +
      "Natural gas — Country A: 25% → 34%; Country B: 30% → 28%; Country C: 35% → 30%; Country D: 21% → 20%.\n" +
      "Renewables — Country A: 13% → 35%; Country B: 22% → 28%; Country C: 45% → 61%; Country D: 8% → 14%.",
    stimulus_caption:
      "Bar chart: electricity generation by source (%), four countries, 2010 and 2020.",
  },
  {
    id: "t1_commute",
    prompt:
      "The graph below shows how people in a European city travelled to work between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    stimulus:
      "Car — 54% (2000), 49% (2005), 41% (2010), 33% (2015), 26% (2020).\n" +
      "Public transport — 28%, 30%, 33%, 36%, 38%.\n" +
      "Cycling — 9%, 12%, 16%, 22%, 28%.\n" +
      "Walking — 9%, 9%, 10%, 9%, 8%.",
    stimulus_caption:
      "Line graph: share of commuters by mode of transport (%), 2000–2020.",
  },
  {
    id: "t1_water",
    prompt:
      "The pie charts below show household water consumption in two countries. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    stimulus:
      "Country X — bathing and showering 34%, toilet 26%, laundry 17%, kitchen 12%, garden 11%.\n" +
      "Country Y — garden 38%, bathing and showering 22%, toilet 18%, laundry 13%, kitchen 9%.",
    stimulus_caption: "Two pie charts: household water use by purpose (%).",
  },
];

export const DEFAULT_TASK_1_PROMPT = TASK_1_PROMPTS[0];
