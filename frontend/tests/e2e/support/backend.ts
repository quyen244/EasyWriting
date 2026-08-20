import type { Page, Route } from "@playwright/test";

/**
 * Network-level stubs for `001`'s assessments API and `003`'s auth API.
 *
 * Every payload here is copied from the real contracts:
 *   - auth:        backend/src/schemas/{account,token}.py
 *   - assessments: backend/src/schemas/assessment.py
 *
 * In particular the assessment result carries `criteria[].explanation` and
 * `criteria[].evidence_quotes` and nothing resembling a per-sentence correction,
 * because that is exactly what the real API returns.
 */

export const ACCOUNT = {
  id: "8f14e45f-ceea-467a-9575-4a4c0dcd88b1",
  email: "learner@example.com",
  display_name: "Mai Nguyen",
};

export const AUTH_RESPONSE = {
  access_token: "e2e-access-token",
  token_type: "bearer",
  expires_in: 900,
  user: ACCOUNT,
};

export const ASSESSMENT_RESULT = {
  submission_id: "0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0",
  overall_band: 6.5,
  criteria: [
    {
      criterion: "TASK_RESPONSE",
      band: 6.0,
      explanation: "The position is clear, though the second body paragraph drifts off task.",
      evidence_quotes: ["Some people believe that technology is harmful."],
      descriptor_reference: "Band 6: addresses all parts of the task",
    },
    {
      criterion: "COHERENCE_COHESION",
      band: 7.0,
      explanation: "Paragraphing is logical and cohesive devices are used accurately.",
      evidence_quotes: ["Furthermore, the evidence suggests otherwise."],
      descriptor_reference: null,
    },
    {
      criterion: "LEXICAL_RESOURCE",
      band: 6.5,
      explanation: "Adequate range with occasional imprecision in collocation.",
      evidence_quotes: ["make a big influence on society"],
      descriptor_reference: null,
    },
    {
      criterion: "GRAMMATICAL_RANGE_ACCURACY",
      band: 6.5,
      explanation: "A mix of simple and complex forms; article errors recur.",
      evidence_quotes: [],
      descriptor_reference: null,
    },
  ],
  created_at: "2026-08-20T10:00:00Z",
};

/**
 * CORS headers for a credentialed cross-origin request.
 *
 * `003`'s auth client sends `credentials: "include"` so the refresh cookie travels, and
 * the browser refuses a wildcard `Access-Control-Allow-Origin` on any credentialed
 * response. The origin has to be echoed back exactly, with `Allow-Credentials: true`.
 * Playwright's `fulfill` does not bypass this — the browser still applies CORS to a
 * stubbed response, so a wildcard here silently fails every signed-in test.
 */
function corsHeaders(route: Route): Record<string, string> {
  const origin = route.request().headers()["origin"] ?? "http://127.0.0.1:3100";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
  };
}

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: "application/json",
    headers: corsHeaders(route),
    body: JSON.stringify(body),
  });
}

interface Options {
  /** Whether a returning visitor has a valid session (drives `/auth/refresh`). */
  signedIn?: boolean;
  /** Override the assessment response with an error body. */
  assessment?:
    | { ok: true }
    | { ok: false; status: number; body: Record<string, unknown>; };
  /** Delay applied to the assessment call, for observing the in-progress state. */
  assessmentDelayMs?: number;
}

export async function stubBackend(page: Page, options: Options = {}) {
  const { signedIn = false, assessment = { ok: true }, assessmentDelayMs = 0 } = options;

  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (route.request().method() === "OPTIONS") {
      return route.fulfill({
        status: 204,
        headers: {
          ...corsHeaders(route),
          "Access-Control-Allow-Headers": "authorization,content-type",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
      });
    }

    if (path.endsWith("/auth/refresh")) {
      return signedIn
        ? json(route, 200, AUTH_RESPONSE)
        : json(route, 401, { error: "SESSION_EXPIRED", message: "No session." });
    }

    if (path.endsWith("/auth/signup") || path.endsWith("/auth/signin")) {
      return json(route, 200, AUTH_RESPONSE);
    }

    if (path.endsWith("/auth/me")) {
      return json(route, 200, ACCOUNT);
    }

    if (path.endsWith("/auth/signout")) {
      return route.fulfill({ status: 204, headers: corsHeaders(route) });
    }

    if (path.endsWith("/assessments")) {
      if (assessmentDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, assessmentDelayMs));
      }
      return assessment.ok
        ? json(route, 201, ASSESSMENT_RESULT)
        : json(route, assessment.status, assessment.body);
    }

    return route.continue();
  });
}

/** A Task 2 essay long enough not to trip the client-side word-count warning. */
export const LONG_ESSAY = Array.from(
  { length: 60 },
  () => "Technology has fundamentally reshaped the way modern students learn and revise.",
).join(" ");
