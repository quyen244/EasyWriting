/**
 * The reference's inline stroke icons, transcribed path-for-path from
 * `stitch_ai_ielts_writing_evaluator/code.html`.
 *
 * They are real SVG rather than emoji: emoji render as a different glyph on every
 * platform (and in colour, which fights the section's palette), so the same page would
 * not look like the reference on half the machines that open it.
 *
 * Every icon here is decorative — the heading beside it already carries the meaning —
 * so each is `aria-hidden` and none takes an accessible name.
 */

type IconProps = { className?: string };

function Svg({ className = "", children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

/** Pencil — the Writing focus area. */
export function PencilIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </Svg>
  );
}

/** Microphone — the Speaking focus area. */
export function MicIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </Svg>
  );
}

/** Document with pencil — step 1, Analyze. */
export function AnalyzeIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </Svg>
  );
}

/** Clipboard with a tick — step 2, Evaluate Criteria. */
export function CriteriaIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </Svg>
  );
}

/** Tick in a circle — step 3, Score & Improve. */
export function ScoreIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </Svg>
  );
}

/** The hero's trailing arrow. */
export function ArrowRightIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </Svg>
  );
}

/**
 * The hand-drawn curve-and-arrowhead the reference uses as a pointer near the
 * testimonials and the final CTA.
 */
export function SketchArrow({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      data-decoration
      className={`pointer-events-none ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={4}
      viewBox="0 0 100 100"
    >
      <path d="M10 10 Q 30 10 80 70" />
      <path d="M60 70 L 80 70 L 80 50" />
    </svg>
  );
}

/**
 * The dashed path threading the three How-It-Works steps together. Shown only where the
 * steps sit side by side; on a stacked layout it would connect nothing.
 */
export function StepPath({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      data-decoration
      className={`pointer-events-none ${className ?? ""}`}
      fill="none"
      preserveAspectRatio="none"
      stroke="currentColor"
      strokeDasharray="10 10"
      strokeWidth={4}
      viewBox="0 0 1000 200"
    >
      <path d="M50,100 C250,-50 400,250 600,100 C750,-20 850,200 950,100" />
    </svg>
  );
}

/** Padlock — the "Absolute security" proof point. */
export function LockIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M8 11V7a4 4 0 118 0v4" />
      <rect x="5" y="11" width="14" height="10" rx="2" />
    </Svg>
  );
}

/** Globe — the "International standard" proof point. */
export function GlobeIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 010 18a15 15 0 010-18z" />
    </Svg>
  );
}
