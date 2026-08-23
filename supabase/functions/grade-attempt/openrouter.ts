// OpenRouter adapter. Ported from eval/src/llm/openrouter_client.py.
//
// Keeps the harness's retry-repair loop: when the model returns JSON that fails
// validation, the raw reply plus a repair instruction are appended to the conversation
// and it is asked again. That recovers most malformed-JSON cases without a human, which
// matters because one failed criterion fails the whole assessment.
//
// Transport and quota failures are terminal for a call, not retried: re-issuing the
// same request against the same upstream would just burn budget for the same answer.

import { PIPELINE, CRITERION_RESPONSE_SCHEMA } from "./generated/assets.ts";

export interface Bilingual {
  en: string;
  vi: string;
}

export interface EvidenceItem {
  quote: string;
  comment: string;
}

export interface CriterionBlock {
  justification: string;
  descriptor_reference: string;
  band: number;
  confidence: number;
  comment: Bilingual;
  improvement: Bilingual;
  evidence: EvidenceItem[];
}

export type CallStatus = "ok" | "parse_error" | "timeout" | "rate_limited" | "http_error";

export interface LlmResult {
  node: string;
  ok: boolean;
  status: CallStatus;
  parsed?: CriterionBlock;
  error?: string;
  attempts: number;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  reasoningTokens: number;
  // OpenRouter reports this per response. Zero on a `:free` model, which is why it is
  // recorded rather than assumed — the model id is a config value and the day it stops
  // being free, llm_calls should already know.
  costUsd: number;
}

const REPAIR_TEMPLATE = (error: string) =>
  "Your previous response could not be validated.\n" +
  `Error: ${error}\n\n` +
  "Return ONLY a JSON object that satisfies the schema. Do not add commentary, " +
  "markdown fences, or extra fields.";

const TRUNCATION_TEMPLATE =
  "Your previous response was cut off before the JSON was complete because it " +
  "exceeded the output limit.\n\n" +
  "Produce the same JSON structure but SHORTER: return at most half as many items " +
  "in every list, and keep each text field under 200 characters. Completeness of " +
  "the JSON matters more than completeness of the analysis.";

// ── Validation ────────────────────────────────────────────────────────────────
//
// `strict: true` on the request is a request, not a guarantee — this model has been
// observed returning schema-shaped-but-wrong payloads, so the response is checked here
// before anything is persisted. Same defence-in-depth pattern as quote verification:
// the prompt asks, the schema constrains, and code enforces.

// Vietnamese in Latin script (with its diacritics), plus punctuation, digits, and the
// English IELTS terms the prompt explicitly keeps untranslated. Anything outside this —
// CJK, Thai, Arabic, Cyrillic — is a language leak.
//
// This check exists because Phase A measured it happening: 6 of 80 `vi` fields came
// back with stray Chinese ("冠词" substituted for "article"), Arabic, or Thai in them,
// and tightening the prompt alone reduced but did not eliminate it. A leak is a repair
// retry rather than a hard failure, because the model gets it right on most attempts.
const NON_VIETNAMESE_SCRIPT_RE =
  /[^\p{Script=Latin}\p{M}\p{N}\p{P}\p{Z}\p{Cc}\p{Sm}\p{Sc}°%…–—’‘“”]/u;

export function findScriptLeak(text: string): string | null {
  const match = NON_VIETNAMESE_SCRIPT_RE.exec(text);
  return match ? match[0] : null;
}

export function validateBlock(value: unknown): { block?: CriterionBlock; error?: string } {
  const v = value as Partial<CriterionBlock> | null;
  if (!v || typeof v !== "object") return { error: "response is not a JSON object" };

  for (const key of ["justification", "descriptor_reference"] as const) {
    if (typeof v[key] !== "string" || !v[key]) return { error: `${key} is missing or empty` };
  }
  if (typeof v.band !== "number" || !Number.isFinite(v.band)) {
    return { error: "band is missing or not a number" };
  }
  if (typeof v.confidence !== "number" || !Number.isFinite(v.confidence)) {
    return { error: "confidence is missing or not a number" };
  }
  for (const key of ["comment", "improvement"] as const) {
    const pair = v[key];
    if (!pair || typeof pair !== "object") return { error: `${key} is missing` };
    for (const lang of ["en", "vi"] as const) {
      // Not cosmetic: criteria_match_task() rejects an insert whose comment.en or
      // comment.vi is empty, so an empty string here is a row the database refuses.
      if (typeof pair[lang] !== "string" || !pair[lang].trim()) {
        return { error: `${key}.${lang} is empty` };
      }
    }
    const leak = findScriptLeak(pair.vi);
    if (leak) {
      return {
        error:
          `${key}.vi contains "${leak}", which is not Vietnamese. Rewrite both ` +
          "Vietnamese fields using only Vietnamese words and the English IELTS terms " +
          "the instructions allow.",
      };
    }
  }
  if (!Array.isArray(v.evidence)) return { error: "evidence is missing or not an array" };
  for (const item of v.evidence) {
    if (typeof item?.quote !== "string" || typeof item?.comment !== "string") {
      return { error: "every evidence item needs a string quote and comment" };
    }
  }
  return { block: v as CriterionBlock };
}

// Some models wrap JSON in ```json ... ``` despite response_format.
function stripFences(content: string): string {
  const clean = content.trim();
  if (!clean.startsWith("```")) return clean;
  const lines = clean.split("\n");
  return lines.length > 2 ? lines.slice(1, -1).join("\n") : clean;
}

export interface ChatOptions {
  apiKey: string;
  messages: { role: string; content: string }[];
  node: string;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

export async function callCriterion(opts: ChatOptions): Promise<LlmResult> {
  const doFetch = opts.fetchImpl ?? fetch;
  const started = Date.now();
  let convo = [...opts.messages];
  let promptTokens = 0;
  let completionTokens = 0;
  let reasoningTokens = 0;
  let costUsd = 0;
  let lastError = "unknown error";

  const base = (result: Partial<LlmResult>): LlmResult => ({
    node: opts.node,
    ok: false,
    status: "http_error",
    attempts: 1,
    latencyMs: Date.now() - started,
    promptTokens,
    completionTokens,
    reasoningTokens,
    costUsd,
    ...result,
  });

  if (!opts.apiKey) {
    return base({
      status: "http_error",
      error: "OPENROUTER_API_KEY is not set — scoring cannot run.",
    });
  }

  for (let attempt = 1; attempt <= PIPELINE.model.maxRetries + 1; attempt++) {
    let response: Response;
    const timeout = AbortSignal.timeout(PIPELINE.model.timeoutMs);
    const signal = opts.signal
      ? AbortSignal.any([opts.signal, timeout])
      : timeout;

    try {
      response = await doFetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal,
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://rexsantech.com",
          "X-Title": "WriteWise",
        },
        body: JSON.stringify({
          model: PIPELINE.model.id,
          messages: convo,
          temperature: PIPELINE.model.temperature,
          max_tokens: PIPELINE.model.maxTokens,
          seed: PIPELINE.model.seed,
          reasoning: PIPELINE.model.reasoning,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "CriterionEvaluation",
              strict: true,
              schema: CRITERION_RESPONSE_SCHEMA,
            },
          },
        }),
      });
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === "TimeoutError";
      return base({
        status: aborted ? "timeout" : "http_error",
        error: `${(err as Error).name}: ${(err as Error).message}`,
        attempts: attempt,
      });
    }

    if (!response.ok) {
      const body = (await response.text()).slice(0, 300);
      return base({
        status: response.status === 429 ? "rate_limited" : "http_error",
        error: `HTTP ${response.status}: ${body}`,
        attempts: attempt,
      });
    }

    const raw = await response.json();
    const choice = raw?.choices?.[0] ?? {};
    const content: string = choice?.message?.content ?? "";
    const truncated = choice?.finish_reason === "length";
    const usage = raw?.usage ?? {};
    promptTokens += usage.prompt_tokens ?? 0;
    completionTokens += usage.completion_tokens ?? 0;
    reasoningTokens += usage.completion_tokens_details?.reasoning_tokens ?? 0;
    costUsd += usage.cost ?? 0;

    let candidate: unknown;
    try {
      candidate = JSON.parse(stripFences(content));
    } catch (err) {
      lastError = (truncated ? "output truncated at token limit: " : "") +
        (err as Error).message;
      convo = [
        ...convo,
        { role: "assistant", content },
        { role: "user", content: truncated ? TRUNCATION_TEMPLATE : REPAIR_TEMPLATE(lastError) },
      ];
      continue;
    }

    const { block, error } = validateBlock(candidate);
    if (block) {
      return base({
        ok: true,
        status: "ok",
        parsed: block,
        attempts: attempt,
        latencyMs: Date.now() - started,
      });
    }

    lastError = (truncated ? "output truncated at token limit: " : "") + error!;
    convo = [
      ...convo,
      { role: "assistant", content },
      { role: "user", content: truncated ? TRUNCATION_TEMPLATE : REPAIR_TEMPLATE(lastError) },
    ];
  }

  return base({
    status: "parse_error",
    error: lastError,
    attempts: PIPELINE.model.maxRetries + 1,
  });
}
