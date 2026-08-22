"use client";

/**
 * The Speaking screens.
 *
 * "Coming soon" is a design problem, not an empty page: a learner who paid for a product
 * and lands on a blank panel concludes the product is broken. So this says what is
 * coming, in enough detail to be believed, offers a way to be told when it lands, and
 * points at the thing that does work today.
 *
 * The notify form is mock — it validates, confirms, and stores nothing. It says so in
 * plain terms rather than implying a mailing list exists.
 */

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Button, Card, PageHeader, Pill } from "@/components/app/Primitives";
import { useLocale } from "@/hooks/useLocale";
import type { MessageKey } from "@/lib/i18n";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FEATURES: { titleKey: MessageKey; bodyKey: MessageKey }[] = [
  { titleKey: "soon.featureRecord", bodyKey: "soon.featureRecordBody" },
  { titleKey: "soon.featureFeedback", bodyKey: "soon.featureFeedbackBody" },
  { titleKey: "soon.featureTranscript", bodyKey: "soon.featureTranscriptBody" },
];

export default function ComingSoon({
  titleKey,
  bodyKey,
}: {
  titleKey: MessageKey;
  bodyKey: MessageKey;
}) {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError(t("soon.notifyInvalid"));
      return;
    }
    setError(null);
    setSubmitted(email.trim());
  }

  return (
    <>
      <PageHeader
        eyebrow={t("soon.eyebrow")}
        title={t(titleKey)}
        description={t(bodyKey)}
        actions={<Pill tone="info">{t("common.comingSoon")}</Pill>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <SpeakingIllustration />
          <div className="p-6">
            <h2 className="font-display text-headline-sm text-on-surface">
              {t("soon.featuresTitle")}
            </h2>
            <ul className="mt-4 flex flex-col gap-4">
              {FEATURES.map((feature) => (
                <li key={feature.titleKey} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                  />
                  <div>
                    <p className="font-body text-body-md font-semibold text-on-surface">
                      {t(feature.titleKey)}
                    </p>
                    <p className="mt-0.5 font-body text-body-sm text-on-surface-variant">
                      {t(feature.bodyKey)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-6">
            <h2 className="font-display text-headline-sm text-on-surface">
              {t("soon.notifyTitle")}
            </h2>
            <p className="mt-2 font-body text-body-sm text-on-surface-variant">
              {t("soon.notifyBody")}
            </p>

            {submitted ? (
              <p
                role="status"
                className="mt-4 rounded-md border border-tertiary/40 bg-tertiary-container/50 px-4 py-3 font-body text-body-sm text-on-surface"
              >
                {t("soon.notifyDone", { email: submitted })}
              </p>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-2">
                <label htmlFor="notify_email" className="sr-only">
                  {t("auth.email")}
                </label>
                <input
                  id="notify_email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("soon.notifyPlaceholder")}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "notify_error" : undefined}
                  className={`w-full rounded-md border bg-surface-container-lowest px-3.5 py-2.5 font-body text-body-md text-on-surface transition-colors hover:border-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 ${
                    error ? "border-error" : "border-outline-variant"
                  }`}
                />
                {error && (
                  <p id="notify_error" className="font-body text-body-sm text-error">
                    {error}
                  </p>
                )}
                <Button type="submit">{t("soon.notifyCta")}</Button>
              </form>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-body text-label-caps uppercase text-on-surface-variant">
              {t("soon.meanwhile")}
            </h2>
            <p className="mt-2 font-body text-body-sm text-on-surface-variant">
              {t("soon.meanwhileBody")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/workspace"
                className="inline-flex items-center gap-2 rounded-md bg-primary-container px-4 py-2 font-body text-body-sm font-semibold text-on-primary-container transition-colors hover:bg-primary"
              >
                {t("nav.grader")}
              </Link>
              <Link
                href="/mock-test/writing"
                className="inline-flex items-center gap-2 rounded-md border border-outline-variant px-4 py-2 font-body text-body-sm font-semibold text-on-surface transition-colors hover:border-outline"
              >
                {t("mock.writingTitle")}
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

/**
 * A waveform, drawn rather than illustrated.
 *
 * Bars sized by a fixed sequence, not by `Math.random()`: a random illustration reshuffles
 * on every render, which reads as a glitch. Fixed values also mean the server and the
 * client draw the same thing.
 */
const WAVE = [
  14, 26, 38, 30, 46, 62, 48, 34, 52, 70, 58, 40, 30, 44, 60, 76, 64, 46, 32, 24, 36, 50,
  42, 28, 18, 30, 44, 34, 22, 14,
];

function SpeakingIllustration() {
  return (
    <div
      aria-hidden="true"
      className="flex h-44 items-center justify-center gap-1.5 bg-surface-container-low px-6"
    >
      {WAVE.map((height, index) => (
        <span
          key={index}
          className="w-1.5 rounded-full bg-primary/40"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}
