/**
 * Shared glue for the Supabase-backed half of this boundary — content reads and
 * practice writes. Grading stays on the mock transport (see grading.ts, store.ts):
 * the scoring pipeline that would ever move a `writing_attempts` row to `status =
 * 'scored'` doesn't exist yet, and RLS deliberately refuses `authenticated` the columns
 * that would let the client fake one (verified: a learner POSTing `overall_band` gets
 * 403). Everything in this file is for the parts RLS actually allows a learner to do.
 */

import type { PostgrestError } from "@supabase/supabase-js";

import { ApiError } from "./types";

/**
 * A Postgrest failure that isn't a documented outcome.
 *
 * RLS already keeps a learner from causing one on the write side; if this fires anyway
 * it's a network blip or a real bug, not a case a caller can act on the way it can
 * `BELOW_MIN_WORDS` — so it gets a generic code rather than an invented specific one.
 */
export function toApiError(error: PostgrestError): ApiError {
  // The grading rate limit raises with SQLSTATE PT429, which PostgREST turns into a
  // real 429. Its message names the limit and the window and is written to be read by
  // the learner, so it is passed through rather than replaced with something vaguer.
  if (error.code === "PT429") {
    return new ApiError("RATE_LIMITED", error.message);
  }
  return new ApiError("UNAVAILABLE", error.message);
}
