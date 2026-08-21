/**
 * The design's decorative furniture: rotated marker labels, star/dot stickers and the
 * blurred colour blobs behind the hero.
 *
 * All of it is `aria-hidden` and carries `data-decoration`, which the reduced-motion
 * rule in `globals.css` uses to remove it entirely. None of these elements carry
 * meaning — if any of them ever does, it belongs in real markup instead.
 */

export function Star({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      data-decoration
      className={`pointer-events-none ${className}`}
      fill="currentColor"
    >
      <path d="M12 0l2.4 8.1L22.5 6l-6.3 5.6 4.2 7.4-8.4-3.4L3.6 19l4.2-7.4L1.5 6l8.1 2.1z" />
    </svg>
  );
}

export function Dot({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-decoration
      className={`pointer-events-none block rounded-full ${className}`}
    />
  );
}

/** A blurred colour wash — the hero's yellow/blue haze. */
export function Blob({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-decoration
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
    />
  );
}

/**
 * Handwritten marker text ("Simple process", "Start practicing →").
 *
 * Rendered as real text rather than an image so it stays selectable and translatable;
 * the tilt is `data-tilt` so it flattens under reduced motion instead of disappearing,
 * because unlike the stickers this text does say something.
 */
export function Marker({
  children,
  className = "",
  tilt = "-rotate-3",
}: {
  children: React.ReactNode;
  className?: string;
  tilt?: string;
}) {
  return (
    <span data-tilt className={`inline-block font-accent text-marker ${tilt} ${className}`}>
      {children}
    </span>
  );
}
