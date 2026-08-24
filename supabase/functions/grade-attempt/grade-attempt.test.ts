// Tests for the pure logic behind marking. Run: deno test supabase/functions/grade-attempt/
//
// Everything tested here is deliberately free of network, database and clock: the gate,
// the feature extraction, the band arithmetic, the quote verification, the prompt
// assembly, and the response validation. Those are the parts that decide a band, and
// they are the parts a benchmark in eval/ measured — so they are also the parts where a
// silent divergence between the two implementations would be most expensive.
//
// Several expectations below are pinned to the numbers eval/'s Python produces for the
// same input. They are not arbitrary: matching Python is the point of the port.

// Assertions are local rather than pulled from @std/assert so this suite runs with no
// network at all — the whole point of testing the pure logic is that it needs nothing.
function assert(condition: unknown, message = "assertion failed"): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals(actual: unknown, expected: unknown, message?: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  assert(a === e, message ?? `expected ${e}, got ${a}`);
}

function assertAlmostEquals(actual: number, expected: number, tolerance: number): void {
  assert(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

function assertStringIncludes(actual: string, needle: string): void {
  assert(actual.includes(needle), `expected ${JSON.stringify(actual)} to include ${JSON.stringify(needle)}`);
}

import { aggregateOverall, clamp, lengthPenalty, roundToHalf, snapBand } from "./aggregate.ts";
import {
  extractFeatures,
  findCohesiveDevices,
  repeatedContentWords,
  splitSentences,
  tokenize,
} from "./extract.ts";
import { ABSOLUTE_MIN_WORDS, findUnscoreableReason } from "./gate.ts";
import { PIPELINE } from "./generated/assets.ts";
import { callCriterion, findScriptLeak, validateBlock } from "./openrouter.ts";
import { buildCriterionMessages, formatFeatures } from "./prompt.ts";
import { dropUnverifiedQuotes, normalize, quoteInEssay } from "./verify.ts";

const ESSAY = `Social media has changed the way people communicate with each other.
Some argue that these platforms bring people closer together, while others believe
they cause isolation. In my opinion, the benefits outweigh the drawbacks.

Firstly, social media allows families separated by distance to stay in contact.
A grandparent in a rural village can watch their grandchildren grow up through
photographs and video calls, which was impossible a generation ago. Moreover,
online communities give people with rare interests somewhere to belong.

However, there are genuine costs. Many young people compare their ordinary lives to
the edited highlights of others, and this comparison damages confidence.
In addition, time spent scrolling is time not spent on study or exercise.

In conclusion, although social media carries real risks, its capacity to connect
people across distance makes it more useful than harmful, provided it is used
with some discipline.`;

// ── The gate ──────────────────────────────────────────────────────────────────

Deno.test("gate: empty submission is rejected", () => {
  const features = extractFeatures("   ", "TASK_2");
  assertEquals(findUnscoreableReason("   ", features)?.code, "EMPTY_SUBMISSION");
});

Deno.test("gate: a submission under the absolute floor is rejected", () => {
  const text = "Social media is good for everyone in the world today.";
  const features = extractFeatures(text, "TASK_2");
  assert(features.wordCount < ABSOLUTE_MIN_WORDS);
  assertEquals(findUnscoreableReason(text, features)?.code, "TOO_SHORT");
});

Deno.test("gate: predominantly non-Latin script is rejected, not translated", () => {
  // 25 repetitions, not 10: Chinese has no spaces, so each sentence tokenises as ONE
  // word and a shorter sample trips the word-count floor first. Python counts it the
  // same way — verified — so this is shared behaviour, not a porting artefact.
  const text = "这是一篇关于社交媒体的文章。".repeat(25);
  const features = extractFeatures(text, "TASK_2");
  assertEquals(findUnscoreableReason(text, features)?.code, "NOT_ENGLISH");
});

Deno.test("gate: degenerate vocabulary is rejected", () => {
  const text = "essay ".repeat(60);
  const features = extractFeatures(text, "TASK_2");
  assertEquals(findUnscoreableReason(text, features)?.code, "NOT_ESSAY_PROSE");
});

Deno.test("gate: long text with no sentence structure is rejected", () => {
  const words = Array.from({ length: 120 }, (_, i) => `word${i}`).join(" ");
  const features = extractFeatures(words, "TASK_2");
  assertEquals(findUnscoreableReason(words, features)?.code, "NOT_ESSAY_PROSE");
});

Deno.test("gate: a short-but-real essay passes — under-length is a penalty, not a rejection", () => {
  // 100-ish words against a 250 minimum. This must reach the model: the length penalty
  // handles it, and rejecting it would cost a real learner their submission.
  const short = ESSAY.split("\n\n")[0];
  const features = extractFeatures(short, "TASK_2");
  assert(!features.meetsMinWords);
  assertEquals(findUnscoreableReason(short, features), null);
});

// ── Feature extraction ────────────────────────────────────────────────────────

Deno.test("tokenize: keeps internal apostrophes and hyphens, not edge ones", () => {
  assertEquals(tokenize("don't well-being 'quoted' -dash-"), [
    "don't",
    "well-being",
    "quoted",
    "dash",
  ]);
});

Deno.test("tokenize: counts unicode letters as words", () => {
  assertEquals(tokenize("café résumé naïve").length, 3);
});

Deno.test("splitSentences: splits on terminal punctuation, drops empties", () => {
  assertEquals(splitSentences("One. Two! Three?  "), ["One", "Two", "Three"]);
});

Deno.test("repeatedContentWords: skips stopwords, short words, and rare words", () => {
  const words = [
    ...Array(4).fill("social"),
    ...Array(3).fill("people"), // a stopword — must not appear
    ...Array(2).fill("distance"), // below minCount
    ...Array(5).fill("media"),
  ];
  assertEquals(repeatedContentWords(words), [["media", 5], ["social", 4]]);
});

Deno.test("extractFeatures: reports the deficit ratio the penalty is computed from", () => {
  const features = extractFeatures(ESSAY, "TASK_2");
  assertEquals(features.minWordsRequired, 250);
  assert(features.wordCount > 100 && features.wordCount < 250);
  assertAlmostEquals(
    features.lengthDeficitRatio,
    (250 - features.wordCount) / 250,
    0.0001,
  );
  assertEquals(features.meetsMinWords, false);
});

Deno.test("extractFeatures: a Task 1 essay is measured against 150 words", () => {
  assertEquals(extractFeatures(ESSAY, "TASK_1").minWordsRequired, 150);
});

Deno.test("extractFeatures: finds the cohesive devices actually present", () => {
  const found = extractFeatures(ESSAY, "TASK_2").cohesiveDevicesFound;
  for (const device of ["firstly", "moreover", "however", "in addition", "in conclusion"]) {
    assert(found.includes(device), `expected to find "${device}" in ${JSON.stringify(found)}`);
  }
  // "although" appears; "nevertheless" does not — the list must be evidence, not a guess.
  assert(found.includes("although"));
  assert(!found.includes("nevertheless"));
});

Deno.test("findCohesiveDevices: a multi-word device broken across lines is not found", () => {
  // Pinned because it is surprising, not because it is desirable: the phrase match is a
  // literal substring test against the raw text, so a line break inside "in addition"
  // hides it. Python does exactly the same thing — verified against
  // eval/src/pipeline/preprocess.py — and the feature list only ever feeds the prompt as
  // a hint, so the two implementations agreeing matters more here than either being
  // clever. Change this and the Python side must change with it.
  assertEquals(findCohesiveDevices("However, costs exist. In\naddition, time is lost."), [
    "however",
  ]);
  assertEquals(findCohesiveDevices("However, costs exist. In addition, time is lost."), [
    "however",
    "in addition",
  ]);
});

// ── Band arithmetic ───────────────────────────────────────────────────────────

Deno.test("roundToHalf: .25 and .75 round UP, as IELTS does and banker's rounding does not", () => {
  assertEquals(roundToHalf(6.25), 6.5);
  assertEquals(roundToHalf(6.75), 7.0);
  assertEquals(roundToHalf(6.24), 6.0);
  assertEquals(roundToHalf(6.74), 6.5);
});

Deno.test("snapBand: clamps off-scale values and reports the coercion", () => {
  assertEquals(snapBand(6.5), { band: 6.5, coerced: false });
  assertEquals(snapBand(6.3), { band: 6.5, coerced: true });
  assertEquals(snapBand(12), { band: 9, coerced: true });
  assertEquals(snapBand(0), { band: 1, coerced: true });
});

Deno.test("lengthPenalty: thresholds come from the pipeline config, not constants", () => {
  const t = PIPELINE.lengthPenalty;
  assertEquals(lengthPenalty(0.0, t), 0);
  assertEquals(lengthPenalty(0.15, t), 0); // boundary is exclusive
  assertEquals(lengthPenalty(0.16, t), 0.5);
  assertEquals(lengthPenalty(0.40, t), 0.5);
  assertEquals(lengthPenalty(0.41, t), 1.0);
});

Deno.test("aggregateOverall: averages then snaps to the half-band grid", () => {
  assertEquals(aggregateOverall([6, 6.5, 7, 6.5]).overall, 6.5);
  assertEquals(aggregateOverall([6, 6, 7, 7]).overall, 6.5);
  // 6.375 -> 6.5: the mean is snapped, never truncated.
  assertEquals(aggregateOverall([6, 6, 6.5, 7]).overall, 6.5);
});

Deno.test("aggregateOverall: a missing criterion marks the result partial", () => {
  const result = aggregateOverall([6, 6.5, null, 7]);
  assertEquals(result.partial, true);
  assertEquals(aggregateOverall([6, 6.5, 7, 7]).partial, false);
});

Deno.test("clamp: keeps bands inside the 1-9 scale", () => {
  assertEquals(clamp(-3), 1);
  assertEquals(clamp(11), 9);
  assertEquals(clamp(6.5), 6.5);
});

// ── Quote verification ────────────────────────────────────────────────────────

Deno.test("normalize: folds smart quotes, dashes and whitespace", () => {
  assertEquals(normalize("The  \n “word’s”  —  here"), 'the "word\'s" - here');
});

Deno.test("quoteInEssay: accepts a genuine span regardless of quoting style", () => {
  const essayNormalized = normalize(ESSAY);
  assert(quoteInEssay("the benefits outweigh the drawbacks", essayNormalized));
  assert(quoteInEssay("The Benefits Outweigh The Drawbacks", essayNormalized));
  assert(quoteInEssay("families   separated by distance", essayNormalized));
});

Deno.test("quoteInEssay: rejects a fabricated span — matching is exact, never fuzzy", () => {
  const essayNormalized = normalize(ESSAY);
  assert(!quoteInEssay("the advantages outweigh the disadvantages", essayNormalized));
});

Deno.test("quoteInEssay: rejects a quote too short to mean anything", () => {
  // "the" appears in the essay, but a three-character match proves nothing about
  // whether the model read it.
  assert(!quoteInEssay("the", normalize(ESSAY)));
});

Deno.test("dropUnverifiedQuotes: keeps the real ones with their commentary attached", () => {
  const { kept, dropped } = dropUnverifiedQuotes(
    [
      { quote: "the benefits outweigh the drawbacks", comment: "clear position" },
      { quote: "a sentence the learner never wrote", comment: "fabricated" },
    ],
    ESSAY,
  );
  assertEquals(dropped, 1);
  assertEquals(kept.length, 1);
  assertEquals(kept[0].comment, "clear position");
});

// ── Prompt assembly ───────────────────────────────────────────────────────────

Deno.test("formatFeatures: renders the statistics block the prompt calls ground truth", () => {
  const text = formatFeatures(extractFeatures(ESSAY, "TASK_2"));
  assertStringIncludes(text, "minimum required: 250");
  assertStringIncludes(text, "BELOW minimum");
  assertStringIncludes(text, "Type-token ratio: 0.");
});

Deno.test("buildCriterionMessages: sends the rubric for the criterion under assessment", () => {
  const features = extractFeatures(ESSAY, "TASK_2");
  const messages = buildCriterionMessages({
    taskType: "TASK_2",
    criterion: "LEXICAL_RESOURCE",
    essayText: ESSAY,
    features,
  });

  assertEquals(messages.length, 2);
  assertEquals(messages[0].role, "system");
  assertStringIncludes(messages[0].content, "argumentative essay");

  const user = messages[1].content;
  assertStringIncludes(user, "LEXICAL_RESOURCE");
  assertStringIncludes(user, "Lexical Resource");
  assertStringIncludes(user, "collocation"); // from the LEXICAL_RESOURCE rubric
  assert(!user.includes("DISCRIMINATOR: count error-free sentences")); // grammar's rubric
  assertStringIncludes(user, ESSAY.trim());
});

Deno.test("buildCriterionMessages: every placeholder is substituted", () => {
  const features = extractFeatures(ESSAY, "TASK_2");
  for (const criterion of ["TASK_RESPONSE", "COHERENCE_COHESION", "GRAMMATICAL_RANGE_ACCURACY"]) {
    for (const message of buildCriterionMessages({
      taskType: "TASK_2",
      criterion,
      essayText: ESSAY,
      features,
    })) {
      // A leftover "{criterion_code}" would be sent to the model verbatim.
      assert(
        !/\{(criterion_name|criterion_code|rubric|prompt_block|essay|features|length_rule|task_label)\}/
          .test(message.content),
        `unsubstituted placeholder in ${criterion}`,
      );
    }
  }
});

Deno.test("buildCriterionMessages: only the task criterion is told to ignore length", () => {
  const features = extractFeatures(ESSAY, "TASK_2");
  const build = (criterion: string) =>
    buildCriterionMessages({ taskType: "TASK_2", criterion, essayText: ESSAY, features })[1]
      .content;

  // The prompt half of the arrangement: TR is told NOT to deduct for length because the
  // code deducts it; the others are told length is not their business at all.
  assertStringIncludes(build("TASK_RESPONSE"), "Do NOT deduct marks");
  assertStringIncludes(build("LEXICAL_RESOURCE"), "Ignore essay length entirely");
});

Deno.test("buildCriterionMessages: the Task 1 chart description reaches the model", () => {
  const features = extractFeatures(ESSAY, "TASK_1");
  const user = buildCriterionMessages({
    taskType: "TASK_1",
    criterion: "TASK_ACHIEVEMENT",
    essayText: ESSAY,
    features,
    promptText: "Summarise the information.",
    chartDescription: "A bar chart showing energy production by source, 1990-2020.",
  })[1].content;

  assertStringIncludes(user, "EXAM PROMPT");
  assertStringIncludes(user, "Summarise the information.");
  // The model cannot see the image, so the description is what the mark rests on (D-4).
  assertStringIncludes(user, "A bar chart showing energy production");
});

Deno.test("buildCriterionMessages: no exam prompt means no empty EXAM PROMPT heading", () => {
  const features = extractFeatures(ESSAY, "TASK_2");
  const user = buildCriterionMessages({
    taskType: "TASK_2",
    criterion: "TASK_RESPONSE",
    essayText: ESSAY,
    features,
  })[1].content;
  assert(!user.includes("EXAM PROMPT"));
});

// ── Response validation ───────────────────────────────────────────────────────

const VALID_BLOCK = {
  justification: "The essay matches the band 6 descriptor rather than 5 or 7.",
  descriptor_reference: "LEXICAL_RESOURCE band 6",
  band: 6,
  confidence: 0.8,
  comment: { en: "Your vocabulary is adequate.", vi: "Vốn từ của bạn ở mức đủ dùng." },
  improvement: {
    en: "Replace repeated words with precise synonyms.",
    vi: "Hãy thay các từ lặp lại bằng từ đồng nghĩa chính xác hơn.",
  },
  evidence: [{ quote: "the benefits outweigh the drawbacks", comment: "clear position" }],
};

Deno.test("validateBlock: accepts a well-formed bilingual response", () => {
  const { block, error } = validateBlock(VALID_BLOCK);
  assertEquals(error, undefined);
  assertEquals(block?.band, 6);
});

Deno.test("validateBlock: an empty vi comment is caught here, not by the database", () => {
  // criteria_match_task() would reject the row anyway; catching it here turns a hard
  // write failure into a repair retry the learner never sees.
  const { error } = validateBlock({
    ...VALID_BLOCK,
    comment: { en: "Fine.", vi: "   " },
  });
  assertStringIncludes(error ?? "", "comment.vi is empty");
});

Deno.test("validateBlock: rejects a missing band", () => {
  const { band: _drop, ...withoutBand } = VALID_BLOCK;
  assertStringIncludes(validateBlock(withoutBand).error ?? "", "band");
});

Deno.test("validateBlock: rejects evidence that is not a list of quote/comment pairs", () => {
  assertStringIncludes(
    validateBlock({ ...VALID_BLOCK, evidence: ["just a string"] }).error ?? "",
    "evidence item",
  );
});

Deno.test("findScriptLeak: catches the leaks Phase A actually measured", () => {
  // Real examples from eval/data/reports/20260823-174535-2786: Chinese substituted for
  // the term "article", plus stray Arabic and Thai.
  assertEquals(findScriptLeak("Bạn còn nhầm lẫn về 冠词 trong câu."), "冠");
  assertEquals(findScriptLeak("Câu này có lỗi ไทย ở cuối."), "ไ");
  assertEquals(findScriptLeak("Bạn cần chú ý العربية hơn."), "ا");
});

Deno.test("findScriptLeak: leaves legitimate Vietnamese and kept English terms alone", () => {
  assertEquals(findScriptLeak("Bạn dùng cohesive devices khá tốt, nhưng chưa đa dạng."), null);
  assertEquals(
    findScriptLeak("Hãy mở rộng lexical range: thay “good” bằng một từ chính xác hơn (2-3 từ)."),
    null,
  );
});

Deno.test("validateBlock: a script leak becomes a repair instruction, not a hard failure", () => {
  const { error } = validateBlock({
    ...VALID_BLOCK,
    improvement: { en: "Fix your articles.", vi: "Hãy chú ý 冠词 khi viết." },
  });
  assertStringIncludes(error ?? "", "improvement.vi");
  assertStringIncludes(error ?? "", "not Vietnamese");
});

// ── Retry policy ──────────────────────────────────────────────────────────────
//
// Written because of a real incident: four calls died with `tls handshake eof` 43
// seconds in, all four reported retry_count 0, and the learner was told scoring had
// failed — when a second attempt would very likely have worked.

const OK_BODY = {
  choices: [{ message: { content: JSON.stringify(VALID_BLOCK) }, finish_reason: "stop" }],
  usage: { prompt_tokens: 100, completion_tokens: 50 },
};

function okResponse(): Response {
  return new Response(JSON.stringify(OK_BODY), { status: 200 });
}

Deno.test("callCriterion: retries a dropped connection and succeeds on the next try", async () => {
  let calls = 0;
  const result = await callCriterion({
    apiKey: "test-key",
    node: "criterion:TASK_RESPONSE",
    messages: [{ role: "user", content: "x" }],
    fetchImpl: () => {
      calls++;
      if (calls === 1) {
        return Promise.reject(new TypeError("client error (Connect): tls handshake eof"));
      }
      return Promise.resolve(okResponse());
    },
  });

  assertEquals(calls, 2);
  assert(result.ok, `expected success, got ${result.error}`);
  assertEquals(result.parsed?.band, 6);
  // Surfaced rather than hidden: a rising retry_count in llm_calls is how a degrading
  // network shows up before it starts failing assessments outright.
  assert(result.attempts > 1);
});

Deno.test("callCriterion: gives up after three connection attempts", async () => {
  let calls = 0;
  const result = await callCriterion({
    apiKey: "test-key",
    node: "criterion:TASK_RESPONSE",
    messages: [{ role: "user", content: "x" }],
    fetchImpl: () => {
      calls++;
      return Promise.reject(new TypeError("tls handshake eof"));
    },
  });

  assertEquals(calls, 3);
  assertEquals(result.ok, false);
  assertEquals(result.status, "http_error");
});

Deno.test("callCriterion: does NOT retry a 429 — retrying spends quota to be refused again", async () => {
  let calls = 0;
  const result = await callCriterion({
    apiKey: "test-key",
    node: "criterion:TASK_RESPONSE",
    messages: [{ role: "user", content: "x" }],
    fetchImpl: () => {
      calls++;
      return Promise.resolve(new Response("rate limit exceeded", { status: 429 }));
    },
  });

  assertEquals(calls, 1);
  assertEquals(result.status, "rate_limited");
});

Deno.test("callCriterion: does NOT retry a timeout — a slow model is not a broken connection", async () => {
  let calls = 0;
  const result = await callCriterion({
    apiKey: "test-key",
    node: "criterion:TASK_RESPONSE",
    messages: [{ role: "user", content: "x" }],
    fetchImpl: () => {
      calls++;
      return Promise.reject(new DOMException("timed out", "TimeoutError"));
    },
  });

  // Retrying would turn one 180s wait into three and still likely time out.
  assertEquals(calls, 1);
  assertEquals(result.status, "timeout");
});

Deno.test("callCriterion: repairs a schema-invalid answer instead of failing outright", async () => {
  let calls = 0;
  const result = await callCriterion({
    apiKey: "test-key",
    node: "criterion:TASK_RESPONSE",
    messages: [{ role: "user", content: "x" }],
    fetchImpl: () => {
      calls++;
      if (calls === 1) {
        // A leak in comment.vi: schema-shaped, but not something a learner may see.
        const leaky = { ...VALID_BLOCK, comment: { en: "Fine.", vi: "Bạn nhầm 冠词." } };
        return Promise.resolve(
          new Response(
            JSON.stringify({
              choices: [{ message: { content: JSON.stringify(leaky) }, finish_reason: "stop" }],
              usage: {},
            }),
            { status: 200 },
          ),
        );
      }
      return Promise.resolve(okResponse());
    },
  });

  assertEquals(calls, 2);
  assert(result.ok);
  assertEquals(result.parsed?.comment.vi, VALID_BLOCK.comment.vi);
});

Deno.test("callCriterion: a missing API key fails without calling anything", async () => {
  let calls = 0;
  const result = await callCriterion({
    apiKey: "",
    node: "criterion:TASK_RESPONSE",
    messages: [{ role: "user", content: "x" }],
    fetchImpl: () => {
      calls++;
      return Promise.resolve(okResponse());
    },
  });

  assertEquals(calls, 0);
  assertEquals(result.ok, false);
  assertStringIncludes(result.error ?? "", "OPENROUTER_API_KEY");
});

// ── Config provenance ─────────────────────────────────────────────────────────

Deno.test("the generated assets carry the benchmarked pipeline, with reasoning off", () => {
  assertEquals(PIPELINE.version, "pipeline-v3.2");
  assertEquals(PIPELINE.promptVersion, "v4");
  // Reasoning tokens are billed output tokens charged against maxTokens; with them on,
  // every criterion was truncated mid-JSON when this was last measured.
  assertEquals(PIPELINE.model.reasoning.enabled, false);
});
