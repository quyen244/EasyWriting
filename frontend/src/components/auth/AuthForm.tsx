"use client";

/**
 * Shared sign-up / sign-in form (002 T017, T018).
 *
 * One component for both because the two differ only in which `useAuth` call they make,
 * which fields they show, and their copy. Two near-identical files would drift — the
 * error handling in particular, which is the part that most needs to behave the same.
 *
 * Errors are surfaced from `003`'s typed `AuthApiError` codes rather than shown as a raw
 * message, so the learner is told what to do rather than what the server said.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/hooks/useAuth";
import { AuthApiError, type AuthErrorCode } from "@/lib/auth";

const ERROR_COPY: Record<AuthErrorCode, string> = {
  EMAIL_ALREADY_REGISTERED:
    "An account with this email already exists. Try signing in instead.",
  WEAK_PASSWORD: "Choose a longer password — at least 8 characters.",
  INVALID_CREDENTIALS: "That email and password combination is not right.",
  TOO_MANY_ATTEMPTS: "Too many attempts. Wait a few minutes before trying again.",
  SESSION_EXPIRED: "Your session expired. Please sign in again.",
};

export default function AuthForm({ mode }: { mode: "signup" | "signin" }) {
  const isSignUp = mode === "signup";
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isSignUp) {
        await signUp({ email, password, display_name: displayName || undefined });
      } else {
        await signIn({ email, password });
      }
      router.replace("/workspace");
    } catch (caught) {
      setError(
        caught instanceof AuthApiError
          ? ERROR_COPY[caught.code]
          : "Could not reach the server. Check your connection and try again.",
      );
      // The password is intentionally left in place: clearing it on failure forces a
      // retype for what is usually a typo in the email field.
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    "mt-1 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body text-body-md text-on-surface focus:border-primary";
  const labelClass = "block text-label-caps uppercase text-on-surface-variant";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-stack-md">
      {error && (
        <p
          role="alert"
          className="rounded border border-error bg-error/10 px-4 py-3 font-body text-body-sm text-on-surface"
        >
          {error}
        </p>
      )}

      {isSignUp && (
        <div>
          <label htmlFor="display_name" className={labelClass}>
            Display name (optional)
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={fieldClass}
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete={isSignUp ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={fieldClass}
        />
        {isSignUp && (
          <p className="mt-1 font-body text-body-sm text-on-surface-variant">
            At least 8 characters.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-primary px-4 py-3 font-body text-body-md font-medium text-on-primary transition-colors hover:bg-primary-container disabled:opacity-60"
      >
        {submitting
          ? isSignUp
            ? "Creating your account…"
            : "Signing you in…"
          : isSignUp
            ? "Create account"
            : "Sign in"}
      </button>

      <p className="font-body text-body-sm text-on-surface-variant">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <Link href="/signin" className="text-primary underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            No account yet?{" "}
            <Link href="/signup" className="text-primary underline">
              Create one
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
