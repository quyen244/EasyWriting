"use client";

/**
 * The small pieces every authenticated screen is built from.
 *
 * They exist so the product has one card, one panel, one segmented control and one page
 * header rather than eight near-identical ones — which is the difference between a
 * coherent product and a set of pages that were each designed on their own day.
 *
 * Styling notes that are decisions, not preferences:
 *  - Cards use a hairline border and no blur shadow. The marketing page's hard offset
 *    shadows belong to a page that is selling; a screen someone works in for an hour
 *    should be quieter than the poster that brought them there.
 *  - Radii stay at `md`/`lg`. Nothing here is a pill except things that are genuinely
 *    status chips.
 */

import type { ReactNode } from "react";

// ── Page header ───────────────────────────────────────────────────────────────

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div className="min-w-0">
        {eyebrow && (
          <p className="flex items-center gap-2 text-mono-caps uppercase text-primary">
            <span aria-hidden="true" className="h-px w-6 bg-primary" />
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 font-display text-headline-md text-on-surface">{title}</h1>
        {description && (
          <p className="mt-2 max-w-prose font-body text-body-md text-on-surface-variant">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

// ── Surfaces ──────────────────────────────────────────────────────────────────

export function Card({
  children,
  className = "",
  as: Tag = "div",
  ...rest
}: React.HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag
      className={`rounded-lg border border-outline-variant bg-surface-container-lowest ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function SectionHeading({
  children,
  hint,
  level = 2,
}: {
  children: ReactNode;
  hint?: string;
  level?: 2 | 3;
}) {
  const Tag = level === 2 ? "h2" : "h3";
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
      <Tag className="font-display text-headline-sm text-on-surface">{children}</Tag>
      {hint && <span className="font-body text-body-sm text-on-surface-variant">{hint}</span>}
    </div>
  );
}

/** The contextual right-hand panel's building block. */
export function Panel({
  title,
  children,
  tone = "default",
}: {
  title?: string;
  children: ReactNode;
  tone?: "default" | "accent";
}) {
  return (
    <section
      className={`rounded-lg border p-5 ${
        tone === "accent"
          ? "border-primary/30 bg-primary-fixed"
          : "border-outline-variant bg-surface-container-low"
      }`}
    >
      {title && (
        <h2
          className={`font-body text-label-caps uppercase ${
            tone === "accent" ? "text-on-primary-fixed" : "text-on-surface-variant"
          }`}
        >
          {title}
        </h2>
      )}
      <div className={title ? "mt-3" : ""}>{children}</div>
    </section>
  );
}

// ── Controls ──────────────────────────────────────────────────────────────────

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Secondary line, e.g. the word minimum under a task name. */
  hint?: string;
}

/**
 * A two-or-three-way switch.
 *
 * Built as radios rather than buttons: the task type is a choice among a fixed set, and
 * a radio group gives arrow-key movement and the right announcement for free.
 */
export function Segmented<T extends string>({
  name,
  value,
  options,
  onChange,
  label,
  size = "md",
}: {
  name: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="sr-only">{label}</legend>
      <div className="inline-flex flex-wrap gap-1 rounded-lg bg-surface-container p-1">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              className={`cursor-pointer rounded-md text-center transition-colors ${
                size === "sm" ? "px-3 py-1.5" : "px-4 py-2"
              } ${
                selected
                  ? "bg-surface-container-lowest shadow-hairline"
                  : "hover:bg-surface-container-high"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                className={`block font-body text-body-sm ${
                  selected ? "font-semibold text-on-surface" : "text-on-surface-variant"
                }`}
              >
                {option.label}
              </span>
              {option.hint && (
                <span className="block font-body text-[11px] text-on-surface-variant">
                  {option.hint}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 font-body text-body-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export const BUTTON_STYLES = {
  primary: `${BUTTON_BASE} bg-primary-container text-on-primary-container hover:bg-primary`,
  secondary: `${BUTTON_BASE} border border-outline-variant bg-surface-container-lowest text-on-surface hover:border-outline`,
  ghost: `${BUTTON_BASE} text-on-surface-variant hover:bg-surface-container hover:text-on-surface`,
} as const;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BUTTON_STYLES;
}) {
  return <button className={`${BUTTON_STYLES[variant]} ${className}`} {...props} />;
}

// ── Status ────────────────────────────────────────────────────────────────────

export type Tone = "neutral" | "positive" | "warning" | "info";

const PILL_TONES: Record<Tone, string> = {
  neutral: "bg-surface-container text-on-surface-variant",
  positive: "bg-tertiary-container text-on-tertiary-container",
  warning: "bg-error-container text-on-error-container",
  info: "bg-secondary-container text-on-secondary-container",
};

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-body text-[11px] font-semibold uppercase tracking-wide ${PILL_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
      <p className="text-mono-caps uppercase text-on-surface-variant">{label}</p>
      <p
        className={`mt-1.5 font-display text-stat tabular-nums ${
          tone === "warning" ? "text-error" : "text-on-surface"
        }`}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1 font-body text-body-sm text-on-surface-variant">{hint}</p>
      )}
    </div>
  );
}

/** Indeterminate progress with a message. Every data-backed view uses this one. */
export function LoadingState({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-6"
    >
      <span
        aria-hidden="true"
        className="size-4 shrink-0 animate-spin rounded-full border-2 border-outline-variant border-t-primary"
      />
      <span className="font-body text-body-md text-on-surface">{message}</span>
    </div>
  );
}

export function ErrorState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-error/40 bg-error-container/40 p-6"
    >
      <h2 className="font-display text-headline-sm text-on-surface">{title}</h2>
      <p className="mt-2 font-body text-body-md text-on-surface-variant">{message}</p>
      {action && <div className="mt-4 flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low p-8 text-center">
      <h2 className="font-display text-headline-sm text-on-surface">{title}</h2>
      <p className="mx-auto mt-2 max-w-prose font-body text-body-md text-on-surface-variant">
        {message}
      </p>
      {action && <div className="mt-5 flex justify-center gap-2">{action}</div>}
    </div>
  );
}

/**
 * A word count against its minimum.
 *
 * Shared because it appears in the grader, in both mock-test tasks and on the result:
 * three implementations of "243 / 250 words" is three chances to disagree about what a
 * word is.
 */
export function WordCount({
  count,
  minimum,
  label,
}: {
  count: number;
  minimum: number;
  label: string;
}) {
  const below = count < minimum;
  return (
    <span
      data-testid="word-count"
      data-below-minimum={below}
      className={`font-body text-body-sm tabular-nums ${
        below ? "text-error" : "text-on-surface-variant"
      }`}
    >
      {label}
    </span>
  );
}
