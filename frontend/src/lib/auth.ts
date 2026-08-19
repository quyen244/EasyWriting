/**
 * Raw auth API calls (003-account-authentication research.md decision 7 — this feature owns
 * the authentication *capability*; 002-core-app-ux owns the pages that call it).
 *
 * The refresh token travels as an httpOnly cookie the browser manages automatically
 * (`credentials: "include"` on every call) — it is never readable or held here. The access
 * token is returned in the JSON body and is the caller's (useAuth's) responsibility to hold
 * in memory only, per 003's research.md decision 4.
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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

async function request<T>(
  path: string,
  init: RequestInit & { accessToken?: string } = {}
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

export interface SignupInput {
  email: string;
  password: string;
  display_name?: string;
}

export function signUp(input: SignupInput): Promise<AuthResponse> {
  return request<AuthResponse>("/api/v1/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface SigninInput {
  email: string;
  password: string;
}

export function signIn(input: SigninInput): Promise<AuthResponse> {
  return request<AuthResponse>("/api/v1/auth/signin", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function refresh(): Promise<AuthResponse> {
  return request<AuthResponse>("/api/v1/auth/refresh", { method: "POST" });
}

export function signOut(accessToken: string): Promise<void> {
  return request<void>("/api/v1/auth/signout", { method: "POST", accessToken });
}

export function me(accessToken: string): Promise<Account> {
  return request<Account>("/api/v1/auth/me", { method: "GET", accessToken });
}
