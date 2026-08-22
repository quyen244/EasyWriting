/**
 * Auth calls, with a mock transport behind the same functions.
 *
 * The real path is unchanged: the refresh token travels as an httpOnly cookie the
 * browser manages (`credentials: "include"`), and the access token is returned in the
 * body for `useAuth` to hold in memory only.
 *
 * The mock path exists because there is no server to talk to yet. It lives here, behind
 * the same five functions, so `useAuth`, the route guard and every screen above them are
 * identical either way — the swap later is this file and nothing else.
 *
 * One deliberate exception to "mock state resets on reload": the *session* is written to
 * `localStorage`. Everything else (history, practice progress) is in-memory by design,
 * but being logged out by a page refresh is not a product decision, it is an accident,
 * and it would make the authenticated product unusable to review.
 */

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
  | "SESSION_EXPIRED";

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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

/** Mock is the default; using the real service is the explicit choice. */
const USE_REAL_API = process.env.NEXT_PUBLIC_USE_REAL_API === "true";

// ── Real transport ────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  init: RequestInit & { accessToken?: string } = {},
): Promise<T> {
  const { accessToken, headers, ...rest } = init;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: "include", // sends/receives the httpOnly refresh_token cookie
    headers: {
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const code: AuthErrorCode = body?.error ?? "SESSION_EXPIRED";
    const message: string = body?.message ?? "Something went wrong. Please try again.";
    throw new AuthApiError(code, message, response.status);
  }

  return body as T;
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
  if (!USE_REAL_API) return mockSignUp(input);
  return request<AuthResponse>("/api/v1/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function signIn(input: SigninInput): Promise<AuthResponse> {
  if (!USE_REAL_API) return mockSignIn(input);
  return request<AuthResponse>("/api/v1/auth/signin", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function refresh(): Promise<AuthResponse> {
  if (!USE_REAL_API) return mockRefresh();
  return request<AuthResponse>("/api/v1/auth/refresh", { method: "POST" });
}

export async function signOut(accessToken: string): Promise<void> {
  if (!USE_REAL_API) {
    writeSession(null);
    return;
  }
  await request<void>("/api/v1/auth/signout", { method: "POST", accessToken });
}

export async function me(accessToken: string): Promise<Account> {
  if (!USE_REAL_API) {
    const account = readSession();
    if (!account) throw new AuthApiError("SESSION_EXPIRED", "No session.", 401);
    return account;
  }
  return request<Account>("/api/v1/auth/me", { method: "GET", accessToken });
}
