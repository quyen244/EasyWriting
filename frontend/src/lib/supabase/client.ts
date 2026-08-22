/**
 * The browser-side Supabase client.
 *
 * One instance per tab, created lazily. `@supabase/ssr`'s browser client keeps the
 * session in cookies rather than localStorage, which is the whole reason it exists here:
 * the middleware and any server component can read the same session the browser holds,
 * so a page never renders "signed out" for a frame before correcting itself.
 *
 * The publishable key is in the client bundle on purpose. It is not a secret — RLS is
 * what controls access, and a key that only works within someone's own rows is safe to
 * hand out. The keys that *are* secret (`service_role`, the model provider's) never
 * leave the compute tier.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/**
 * Whether a real backend is reachable.
 *
 * When it is not — a fresh checkout, or the test runner — the auth layer falls back to
 * its mock transport rather than throwing. That keeps the app reviewable and the unit
 * suite runnable without handing anyone a set of credentials.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

let client: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in frontend/.env.local.",
    );
  }
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  return client;
}
