import { beforeEach, describe, expect, it } from "vitest";

import {
  ApiError,
  getHistory,
  getModule,
  getProgress,
  getResult,
  gradeEssay,
  listModules,
  recommendedModuleFor,
  recordProgress,
  resetStore,
  checkAnswer,
  type GradeTask1Input,
  type GradeTask2Input,
} from "@/lib/api";

/**
 * The data client, exercised through its public functions only.
 *
 * These tests never look inside the store: what matters is that grading a Task 1 essay
 * comes back scored on Task Achievement, that the same essay scores the same twice, and
 * that progress agrees with the history it was derived from. How any of that is stored
 * is the module's business.
 */

const LONG_TASK_2 = `
Remote work is often presented as a benefit to staff and employers alike, though critics
counter that it erodes collaboration. In my view the balance depends almost entirely on
management practice rather than on location itself. Employees recover a substantial amount
of time, because a typical urban commute consumes close to ten hours each week, and that
time is generally spent on rest rather than on additional labour. Employers, meanwhile,
gain access to a far wider hiring pool. Although junior staff undeniably lose the informal
mentoring an office provides, this is a problem of process rather than an inherent cost of
distance, and companies which rebuild mentoring deliberately do not report it.
`.repeat(2);

beforeEach(() => {
  resetStore();
});

describe("gradeEssay", () => {
  it("scores a Task 2 essay on Task Response, never Task Achievement", async () => {
    const input: GradeTask2Input = {
      task_type: "TASK_2",
      prompt_text: "Do you agree?",
      essay_text: LONG_TASK_2,
    };
    const result = await gradeEssay(input, { locale: "en" });

    expect(result.criteria.map((c) => c.code)).toEqual([
      "TASK_RESPONSE",
      "COHERENCE_COHESION",
      "LEXICAL_RESOURCE",
      "GRAMMATICAL_RANGE",
    ]);
    expect(result.min_words).toBe(250);
  });

  it("scores a Task 1 report on Task Achievement, never Task Response", async () => {
    const input: GradeTask1Input = {
      task_type: "TASK_1",
      prompt_text: "Describe the chart.",
      introduction: "The bar chart compares electricity generation across four countries.",
      overview: "Overall, coal fell everywhere while renewables rose in every case.",
      body: LONG_TASK_2,
      chart_description: null,
      has_chart_image: true,
    };
    const result = await gradeEssay(input, { locale: "en" });

    expect(result.criteria[0].code).toBe("TASK_ACHIEVEMENT");
    expect(result.criteria.map((c) => c.code)).not.toContain("TASK_RESPONSE");
    expect(result.min_words).toBe(150);
  });

  it("gives the same essay the same band twice", async () => {
    // A mock that scored differently on a re-grade would contradict itself the first
    // time anyone checked, which reads as a broken product rather than a demo.
    const input: GradeTask2Input = { task_type: "TASK_2", essay_text: LONG_TASK_2 };
    const first = await gradeEssay(input, { locale: "en" });
    const second = await gradeEssay(input, { locale: "en" });

    expect(second.overall_band).toBe(first.overall_band);
    expect(second.criteria.map((c) => c.band)).toEqual(first.criteria.map((c) => c.band));
  });

  it("scores a short essay rather than rejecting it, and flags it provisional", async () => {
    // Long enough to be assessable English, well short of the 250-word minimum: the
    // case the result screen's "words under the minimum" statistic exists for.
    const short =
      "Working from home suits some people and not others. I think the main benefit is " +
      "time, because nobody enjoys a long commute in heavy traffic every single morning. " +
      "The main cost is that new employees learn far less when they cannot overhear the " +
      "people around them working through a difficult problem together.";
    const result = await gradeEssay(
      { task_type: "TASK_2", essay_text: short },
      { locale: "en" },
    );

    expect(result.status).toBe("scored");
    expect(result.provisional).toBe(true);
    expect(result.word_count).toBeLessThan(result.min_words);
    expect(result.length_penalty).toBeGreaterThan(0);
  });

  it("refuses text with too little English to assess", async () => {
    await expect(
      gradeEssay({ task_type: "TASK_2", essay_text: "too short" }, { locale: "en" }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("quotes the learner's own sentences verbatim", async () => {
    const result = await gradeEssay(
      { task_type: "TASK_2", essay_text: LONG_TASK_2 },
      { locale: "en" },
    );
    const quotes = result.criteria.flatMap((c) => c.evidence_quotes);

    expect(quotes.length).toBeGreaterThan(0);
    for (const quote of quotes) {
      expect(LONG_TASK_2.replace(/\s+/g, " ")).toContain(quote);
    }
  });

  it("returns feedback in the requested locale, and re-reads it in the other one", async () => {
    const graded = await gradeEssay(
      { task_type: "TASK_2", essay_text: LONG_TASK_2 },
      { locale: "en" },
    );
    const reread = await getResult(graded.id, "vi");

    expect(reread.criteria[0].comment).not.toBe(graded.criteria[0].comment);
    // The bands are the data; only the prose is localised.
    expect(reread.overall_band).toBe(graded.overall_band);
  });
});

describe("getResult", () => {
  it("throws NOT_FOUND for an id that does not exist", async () => {
    await expect(getResult("sub_nope", "en")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("history and progress", () => {
  it("derives progress from the same history it lists", async () => {
    const [history, progress] = await Promise.all([getHistory(), getProgress()]);

    expect(progress.total_submissions).toBe(history.length);
    expect(progress.band_trend).toHaveLength(history.length);

    const mean =
      history.reduce((sum, entry) => sum + entry.overall_band, 0) / history.length;
    expect(progress.overall_average).toBeCloseTo(Math.round(mean * 10) / 10, 5);
  });

  it("lists history newest first and the trend oldest first", async () => {
    const history = await getHistory();
    const progress = await getProgress();

    expect(Date.parse(history[0].created_at)).toBeGreaterThan(
      Date.parse(history[history.length - 1].created_at),
    );
    expect(Date.parse(progress.band_trend[0].date)).toBeLessThan(
      Date.parse(progress.band_trend[progress.band_trend.length - 1].date),
    );
  });

  it("names Lexical Resource strongest and Grammatical Range weakest for the seeded learner", async () => {
    const progress = await getProgress();
    expect(progress.strongest?.code).toBe("LEXICAL_RESOURCE");
    expect(progress.weakest?.code).toBe("GRAMMATICAL_RANGE");
    expect(progress.weakest!.average).toBeLessThan(progress.strongest!.average);
  });

  it("adds a newly graded essay to history", async () => {
    const before = await getHistory();
    await gradeEssay({ task_type: "TASK_2", essay_text: LONG_TASK_2 }, { locale: "en" });
    const after = await getHistory();

    expect(after).toHaveLength(before.length + 1);
    expect(after[0].source).toBe("grader");
  });
});

describe("practice", () => {
  it("offers six modules for each task", async () => {
    expect(await listModules("TASK_1", "en")).toHaveLength(6);
    expect(await listModules("TASK_2", "en")).toHaveLength(6);
  });

  it("names Task 2's modules in the learner's language", async () => {
    const [english] = await listModules("TASK_2", "en");
    const [vietnamese] = await listModules("TASK_2", "vi");
    expect(vietnamese.title).not.toBe(english.title);
  });

  it("keeps exam material in English regardless of locale", async () => {
    // The source sentence and the model answer are the thing being practised; a
    // Vietnamese translation of them would change the exercise.
    const practiceModule = await getModule("t2_paraphrase_question", "vi");
    expect(practiceModule.exercises[0].model_answer).toMatch(/[a-z]{4,}/i);
    expect(practiceModule.exercises[0].model_answer).toBe(
      (await getModule("t2_paraphrase_question", "en")).exercises[0].model_answer,
    );
  });

  it("sends a weak criterion to a module that trains it", async () => {
    const moduleId = recommendedModuleFor("TASK_2", "GRAMMATICAL_RANGE");
    expect(moduleId).toBeTruthy();

    const practiceModule = await getModule(moduleId!, "en");
    expect(practiceModule.trains).toContain("GRAMMATICAL_RANGE");
    expect(practiceModule.task_type).toBe("TASK_2");
  });

  it("advances module progress when an exercise is completed", async () => {
    const before = (await listModules("TASK_1", "en")).find(
      (candidate) => candidate.id === "t1_write_body",
    )!;
    expect(before.completed_count).toBe(0);

    const practiceModule = await getModule("t1_write_body", "en");
    await checkAnswer(
      {
        module_id: practiceModule.id,
        exercise_id: practiceModule.exercises[0].id,
        answer: "By 2020, Country D relied on coal for 66 per cent of its electricity.",
      },
      "en",
    );
    // Checking an answer and recording progress are separate calls on purpose: reading
    // feedback is not the same act as finishing an exercise, and only the second one
    // should move a learner's position through the module.
    await recordProgress(practiceModule.id, 1);

    const after = (await listModules("TASK_1", "en")).find(
      (candidate) => candidate.id === "t1_write_body",
    )!;
    expect(after.completed_count).toBe(1);
  });

  it("returns observations and a model answer, never a band", async () => {
    const practiceModule = await getModule("t2_paraphrase_question", "en");
    const feedback = await checkAnswer(
      {
        module_id: practiceModule.id,
        exercise_id: practiceModule.exercises[0].id,
        answer: "Remote work is often described as good for staff and for the companies that employ them.",
      },
      "en",
    );

    expect(feedback.notes.length).toBeGreaterThan(0);
    expect(feedback.model_answer).toBe(practiceModule.exercises[0].model_answer);
    expect(JSON.stringify(feedback)).not.toMatch(/band/i);
  });
});
