/**
 * Auth calls, with two transports behind one set of functions.
 *
 * The real one is Supabase Auth. The mock one stays because a checkout without
 * credentials must still run: the unit suite, and anyone reviewing the UI, get a working
 * product rather than a wall of connection errors. Which transport is used is decided by
 * whether Supabase is configured at all — see `isSupabaseConfigured`.
 *
 * The five exported functions and the `AuthErrorCode` set are the contract. Every screen,
 * `useAuth`, and the route guard are written against them and none of them know which
 * transport answered. That is what made swapping the transport a one-file change.
 *
 * Session storage differs by transport, and deliberately so. Supabase keeps the session
 * in cookies (via `@supabase/ssr`) so the middleware can read it before a page renders.
 * The mock keeps it in `localStorage`, because being logged out by a page refresh is not
 * a product decision, it is an accident.
 */

import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export interface Account {
  id: string;
  email: string;
  display_name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: Account;
}

export type AuthErrorCode =
  | "EMAIL_ALREADY_REGISTERED"
  | "WEAK_PASSWORD"
  | "INVALID_CREDENTIALS"
  | "TOO_MANY_ATTEMPTS"
  | "SESSION_EXPIRED"
  /** Sign-up succeeded but no session came back: email confirmation is switched on. */
  | "EMAIL_NOT_CONFIRMED"
  | "UNKNOWN";

export class AuthApiError extends Error {
  readonly code: AuthErrorCode;
  readonly status: number;

  constructor(code: AuthErrorCode, message: string, status: number) {
    super(message);
    this.name = "AuthApiError";
    this.code = code;
    this.status = status;
  }
}

export interface SignupInput {
  email: string;
  password: string;
  display_name?: string;
}

export interface SigninInput {
  email: string;
  password: string;
}

/** A display name derived from the email — better than an empty greeting. */
function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "Learner";
  return cleaned
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// ── Supabase transport ────────────────────────────────────────────────────────

/**
 * Supabase's error codes, mapped onto the ones the UI already knows how to phrase.
 *
 * Anything unmapped becomes UNKNOWN rather than being forced into the nearest-looking
 * code. Telling someone their password is too short when the real problem was something
 * else sends them off fixing the wrong thing.
 */
const SUPABASE_ERROR_CODES: Record<string, AuthErrorCode> = {
  user_already_exists: "EMAIL_ALREADY_REGISTERED",
  email_exists: "EMAIL_ALREADY_REGISTERED",
  weak_password: "WEAK_PASSWORD",
  invalid_credentials: "INVALID_CREDENTIALS",
  email_not_confirmed: "EMAIL_NOT_CONFIRMED",
  over_request_rate_limit: "TOO_MANY_ATTEMPTS",
  over_email_send_rate_limit: "TOO_MANY_ATTEMPTS",
  session_expired: "SESSION_EXPIRED",
  session_not_found: "SESSION_EXPIRED",
  refresh_token_not_found: "SESSION_EXPIRED",
};

function toAuthApiError(error: { code?: string; status?: number; message: string }) {
  const byCode = error.code ? SUPABASE_ERROR_CODES[error.code] : undefined;
  // 429 is meaningful even when the body carries no code we recognise.
  const code: AuthErrorCode = byCode ?? (error.status === 429 ? "TOO_MANY_ATTEMPTS" : "UNKNOWN");
  return new AuthApiError(code, error.message, error.status ?? 400);
}

/**
 * Resolves the account from `profiles`, which is the product's source of truth for a
 * learner's name — not the copy in the auth user's metadata, which is only ever a
 * snapshot of what they typed at sign-up.
 *
 * Falls back to the metadata, then to the email, so the sidebar always has something to
 * show even if the profile row is a moment behind its trigger.
 */
async function accountFromSession(userId: string, email: string, metaName?: unknown) {
  const client = getSupabaseBrowserClient();
  const { data } = await client
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .maybeSingle();

  const fromMeta = typeof metaName === "string" ? metaName.trim() : "";
  const resolvedEmail = data?.email ?? email;

  return {
    id: userId,
    email: resolvedEmail,
    display_name: data?.full_name || fromMeta || nameFromEmail(resolvedEmail),
  } satisfies Account;
}

async function supabaseSignUp(input: SignupInput): Promise<AuthResponse> {
  const client = getSupabaseBrowserClient();
  const { data, error } = await client.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    // Read by the `on_auth_user_created` trigger to seed `profiles.full_name`.
    options: { data: { full_name: input.display_name?.trim() || null } },
  });

  if (error) throw toAuthApiError(error);

  // With confirmations off — the configuration this product expects — a session comes
  // back immediately. If it does not, someone re-enabled them in the dashboard, and
  // saying so plainly beats leaving a blank screen.
  if (!data.session || !data.user) {
    throw new AuthApiError(
      "EMAIL_NOT_CONFIRMED",
      "Sign-up created an account but no session. Email confirmation is enabled in Supabase.",
      400,
    );
  }

  return {
    access_token: data.session.access_token,
    token_type: "bearer",
    expires_in: data.session.expires_in ?? 3600,
    user: await accountFromSession(
      data.user.id,
      data.user.email ?? input.email,
      data.user.user_metadata?.full_name,
    ),
  };
}

async function supabaseSignIn(input: SigninInput): Promise<AuthResponse> {
  const client = getSupabaseBrowserClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: input.email.trim(),
    password: input.password,
  });

  if (error) throw toAuthApiError(error);

  return {
    access_token: data.session.access_token,
    token_type: "bearer",
    expires_in: data.session.expires_in ?? 3600,
    user: await accountFromSession(
      data.user.id,
      data.user.email ?? input.email,
      data.user.user_metadata?.full_name,
    ),
  };
}

async function supabaseRefresh(): Promise<AuthResponse> {
  const client = getSupabaseBrowserClient();

  // `getUser` verifies the token with the auth server; `getSession` would only read what
  // the cookie claims. This call decides whether someone is signed in, so it verifies.
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) {
    throw new AuthApiError("SESSION_EXPIRED", "No session.", 401);
  }

  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) {
    throw new AuthApiError("SESSION_EXPIRED", "No session.", 401);
  }

  return {
    access_token: sessionData.session.access_token,
    token_type: "bearer",
    expires_in: sessionData.session.expires_in ?? 3600,
    user: await accountFromSession(
      userData.user.id,
      userData.user.email ?? "",
      userData.user.user_metadata?.full_name,
    ),
  };
}

// ── Mock transport ────────────────────────────────────────────────────────────

const SESSION_KEY = "writewise.mock-session";
const MIN_PASSWORD_LENGTH = 8;
const MOCK_LATENCY_MS = Number(process.env.NEXT_PUBLIC_MOCK_LATENCY_MS);
const MOCK_DELAY = Number.isFinite(MOCK_LATENCY_MS) ? MOCK_LATENCY_MS : 600;

function pause(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

function readSession(): Account | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Account;
    return parsed && typeof parsed.email === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function writeSession(account: Account | null): void {
  try {
    if (account) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(account));
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // Private-mode storage refusals cost the learner a reload, not the session.
  }
}

function mockResponse(account: Account): AuthResponse {
  return {
    access_token: `mock.${account.id}.${Date.now().toString(36)}`,
    token_type: "bearer",
    expires_in: 3600,
    user: account,
  };
}

function accountFor(email: string, displayName?: string): Account {
  return {
    id: `acc_${email.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "demo"}`,
    email: email.trim(),
    display_name: displayName?.trim() || nameFromEmail(email),
  };
}

async function mockSignUp(input: SignupInput): Promise<AuthResponse> {
  await pause(MOCK_DELAY);
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthApiError("WEAK_PASSWORD", "Password too short.", 400);
  }
  const account = accountFor(input.email, input.display_name);
  writeSession(account);
  return mockResponse(account);
}

async function mockSignIn(input: SigninInput): Promise<AuthResponse> {
  await pause(MOCK_DELAY);
  // The only rule mock mode enforces. Anything shorter is almost always a mistyped
  // password rather than an intentional one, and rejecting it keeps the error state
  // reachable in a demo.
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthApiError("INVALID_CREDENTIALS", "Wrong email or password.", 401);
  }
  const account = accountFor(input.email);
  writeSession(account);
  return mockResponse(account);
}

async function mockRefresh(): Promise<AuthResponse> {
  await pause(Math.min(MOCK_DELAY, 150));
  const account = readSession();
  if (!account) {
    throw new AuthApiError("SESSION_EXPIRED", "No session.", 401);
  }
  return mockResponse(account);
}

// ── Public surface ────────────────────────────────────────────────────────────

export function signUp(input: SignupInput): Promise<AuthResponse> {
  return isSupabaseConfigured ? supabaseSignUp(input) : mockSignUp(input);
}

export function signIn(input: SigninInput): Promise<AuthResponse> {
  return isSupabaseConfigured ? supabaseSignIn(input) : mockSignIn(input);
}

export function refresh(): Promise<AuthResponse> {
  return isSupabaseConfigured ? supabaseRefresh() : mockRefresh();
}

/**
 * `accessToken` is unused by both transports now — Supabase reads the session from the
 * cookie it manages. The parameter stays so `useAuth` and the screens above it did not
 * have to change when the transport did.
 */
export async function signOut(_accessToken?: string): Promise<void> {
  if (!isSupabaseConfigured) {
    writeSession(null);
    return;
  }
  const { error } = await getSupabaseBrowserClient().auth.signOut();
  // A failed sign-out still ends the local session; the caller clears its own state
  // regardless. A server-side session that outlives the cookie simply never validates.
  if (error && error.status !== 401 && error.status !== 403) {
    throw toAuthApiError(error);
  }
}

export async function me(_accessToken?: string): Promise<Account> {
  if (!isSupabaseConfigured) {
    const account = readSession();
    if (!account) throw new AuthApiError("SESSION_EXPIRED", "No session.", 401);
    return account;
  }

  const { data, error } = await getSupabaseBrowserClient().auth.getUser();
  if (error || !data.user) {
    throw new AuthApiError("SESSION_EXPIRED", "No session.", 401);
  }
  return accountFromSession(
    data.user.id,
    data.user.email ?? "",
    data.user.user_metadata?.full_name,
  );
}
