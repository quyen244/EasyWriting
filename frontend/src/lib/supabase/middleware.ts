import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./client";

/**
 * Refreshes the session cookie on every request and reports who is signed in.
 *
 * Two details here are load-bearing and easy to get wrong:
 *
 *  1. The response is rebuilt inside `setAll`, not created once up front. Supabase may
 *     rotate the tokens while answering `getUser()`, and the rotated cookies have to
 *     land on the response that is actually returned — otherwise the browser keeps
 *     sending the old ones and the session dies after an hour.
 *
 *  2. `getUser()`, never `getSession()`. `getSession()` trusts whatever the cookie says;
 *     `getUser()` verifies it with the auth server. On the edge of a route guard, the
 *     difference is between checking a claim and believing one.
 */
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; user: User | null }> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
