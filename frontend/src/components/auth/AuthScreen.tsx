"use client";

/**
 * Sign in and sign up: one screen, two modes.
 *
 * No marketing header, no footer, no product nav. The only way out is the logo, which
 * goes back to the landing page — everything else on this screen exists to finish the
 * one task the visitor came here for.
 *
 * The two modes are separate routes rather than local state, so the URL still means
 * something, the back button works, and a link to "sign up" from anywhere lands in the
 * right mode. The tabs are therefore links, not buttons.
 *
 * Validation runs on submit and then live per field: validating as someone first types
 * their email tells them it is invalid before they have finished writing it.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import PreferenceControls from "@/components/app/PreferenceControls";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { AuthApiError, type AuthErrorCode } from "@/lib/auth";
import type { MessageKey } from "@/lib/i18n";

const ERROR_COPY: Record<AuthErrorCode, MessageKey> = {
  EMAIL_ALREADY_REGISTERED: "auth.errorEmailTaken",
  WEAK_PASSWORD: "auth.errorPasswordShort",
  INVALID_CREDENTIALS: "auth.errorInvalidCredentials",
  TOO_MANY_ATTEMPTS: "auth.errorTooMany",
  SESSION_EXPIRED: "auth.errorSessionExpired",
};

const MIN_PASSWORD_LENGTH = 8;
/** Deliberately loose: the server is the authority, this only catches obvious typos. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = { email?: MessageKey; password?: MessageKey };

export default function AuthScreen({ mode }: { mode: "signin" | "signup" }) {
  const isSignUp = mode === "signup";
  const { signIn, signUp, status } = useAuth();
  const router = useRouter();
  const { t } = useLocale();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<MessageKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validateLive, setValidateLive] = useState(false);

  // A signed-in visitor who navigates back to /signin should land in the product rather
  // than at a form they have already completed.
  useEffect(() => {
    if (status === "authenticated") router.replace("/workspace");
  }, [status, router]);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = "auth.errorEmailRequired";
    else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "auth.errorEmailInvalid";

    if (!password) errors.password = "auth.errorPasswordRequired";
    else if (isSignUp && password.length < MIN_PASSWORD_LENGTH)
      errors.password = "auth.errorPasswordShort";

    return errors;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setValidateLive(true);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      if (isSignUp) {
        await signUp({ email, password, display_name: displayName || undefined });
      } else {
        await signIn({ email, password });
      }
      router.replace("/workspace");
    } catch (caught) {
      setFormError(
        caught instanceof AuthApiError ? ERROR_COPY[caught.code] : "auth.errorNetwork",
      );
      // The password stays. Clearing it forces a retype for what is usually a typo in
      // the email field.
    } finally {
      setSubmitting(false);
    }
  }

  function revalidate() {
    if (validateLive) setFieldErrors(validate());
  }

  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-2">
      {/* Brand panel. Above the form on small screens, beside it from `lg`. */}
      <section className="relative flex flex-col justify-between gap-8 border-b border-outline-variant bg-surface-container-low px-6 py-8 sm:px-10 lg:border-b-0 lg:border-e lg:py-12">
        <div
          aria-hidden="true"
          data-decoration
          className="pointer-events-none absolute inset-0 dot-grid opacity-60"
        />

        <div className="relative flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label={t("auth.backToSite")}
          >
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded bg-primary-container font-body text-[22px] font-bold leading-none text-on-primary-container"
            >
              W
            </span>
            <span className="font-body text-[22px] font-bold tracking-[-0.5px] text-on-surface">
              WriteWise
            </span>
          </Link>
          <PreferenceControls className="lg:hidden" />
        </div>

        <div className="relative max-w-prose">
          <p className="flex items-center gap-2 text-mono-caps uppercase text-primary">
            <span aria-hidden="true" className="h-px w-8 bg-primary" />
            {t("auth.accountEyebrow")}
          </p>
          <h2 className="mt-4 font-display text-display-lg-mobile text-on-surface lg:text-display-lg">
            {t("auth.panelHeading")}
          </h2>
          <p className="mt-4 font-body text-body-lg text-on-surface-variant">
            {t("auth.panelBody")}
          </p>

          <ul className="mt-8 flex flex-col gap-3">
            {(
              [
                "auth.panelPointResults",
                "auth.panelPointProgress",
                "auth.panelPointPractice",
              ] as const
            ).map((key) => (
              <li key={key} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                />
                <span className="font-body text-body-md text-on-surface">{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative hidden lg:block">
          <PreferenceControls />
        </div>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-[26rem]">
          <p className="text-mono-caps uppercase text-on-surface-variant">
            {isSignUp ? t("auth.joinWriteWise") : t("auth.welcomeBack")}
          </p>
          <h1 className="mt-2 font-display text-headline-md text-on-surface">
            {isSignUp ? t("auth.signUpTitle") : t("auth.logInTitle")}
          </h1>
          <p className="mt-2 font-body text-body-md text-on-surface-variant">
            {isSignUp ? t("auth.signUpSubtitle") : t("auth.logInSubtitle")}
          </p>

          <div
            role="tablist"
            aria-label={t("auth.accountEyebrow")}
            className="mt-6 inline-flex gap-1 rounded-lg bg-surface-container p-1"
          >
            <TabLink href="/signin" active={!isSignUp} label={t("auth.tabLogIn")} />
            <TabLink href="/signup" active={isSignUp} label={t("auth.tabSignUp")} />
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
            {formError && (
              <p
                role="alert"
                className="rounded-md border border-error/50 bg-error-container/50 px-4 py-3 font-body text-body-sm text-on-surface"
              >
                {t(formError)}
              </p>
            )}

            {isSignUp && (
              <Field
                id="display_name"
                label={t("auth.displayNameOptional")}
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={setDisplayName}
              />
            )}

            <Field
              id="email"
              label={t("auth.email")}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(value) => {
                setEmail(value);
                revalidate();
              }}
              onBlur={revalidate}
              error={fieldErrors.email ? t(fieldErrors.email) : undefined}
            />

            <Field
              id="password"
              label={t("auth.password")}
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={(value) => {
                setPassword(value);
                revalidate();
              }}
              onBlur={revalidate}
              hint={isSignUp ? t("auth.passwordHint") : undefined}
              error={fieldErrors.password ? t(fieldErrors.password) : undefined}
            />

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-primary-container px-5 py-3 font-body text-body-md font-semibold text-on-primary-container transition-colors hover:bg-primary disabled:opacity-60"
            >
              {submitting
                ? isSignUp
                  ? t("auth.signUpPending")
                  : t("auth.logInPending")
                : isSignUp
                  ? t("auth.signUpAction")
                  : t("auth.logInAction")}
              {!submitting && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="mt-6 font-body text-body-sm text-on-surface-variant">
            {isSignUp ? t("auth.haveAccount") : t("auth.noAccount")}{" "}
            <Link
              href={isSignUp ? "/signin" : "/signup"}
              className="font-semibold text-primary underline underline-offset-2"
            >
              {isSignUp ? t("auth.logInInstead") : t("auth.signUpFree")}
            </Link>
          </p>

          <p className="mt-4 rounded-md bg-surface-container px-3 py-2 font-body text-[12px] text-on-surface-variant">
            {t("auth.demoHint")}
          </p>
        </div>
      </section>
    </div>
  );
}

function TabLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={`rounded-md px-4 py-2 font-body text-body-sm transition-colors ${
        active
          ? "bg-surface-container-lowest font-semibold text-on-surface shadow-hairline"
          : "text-on-surface-variant hover:text-on-surface"
      }`}
    >
      {label}
    </Link>
  );
}

function Field({
  id,
  label,
  type,
  value,
  onChange,
  onBlur,
  autoComplete,
  hint,
  error,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  autoComplete?: string;
  hint?: string;
  error?: string;
}) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label
        htmlFor={id}
        className="block font-body text-label-caps uppercase text-on-surface-variant"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`mt-1.5 w-full rounded-md border bg-surface-container-lowest px-3.5 py-2.5 font-body text-body-md text-on-surface transition-colors placeholder:text-on-surface-variant/70 hover:border-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          error ? "border-error" : "border-outline-variant"
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 font-body text-body-sm text-error">
          {error}
        </p>
      )}
      {hint && !error && (
        <p
          id={`${id}-hint`}
          className="mt-1.5 font-body text-body-sm text-on-surface-variant"
        >
          {hint}
        </p>
      )}
    </div>
  );
}
