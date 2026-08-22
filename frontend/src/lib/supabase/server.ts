import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from "./client";

/**
 * A Supabase client for server components, server actions and route handlers.
 *
 * Created per request, never cached: it carries that request's cookies, and sharing one
 * across requests would mean serving one visitor's session to another.
 *
 * `setAll` is wrapped in a try/catch because server components are not allowed to write
 * cookies. That is not an error to handle — the middleware has already refreshed the
 * session on this request, so the write being dropped here changes nothing.
 */
export async function getSupabaseServerClient() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured; no server client is available.");
  }

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a server component. Harmless — see above.
        }
      },
    },
  });
}
