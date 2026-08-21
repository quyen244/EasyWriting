/**
 * The numbered kicker above each section heading — `01 / HOW IT WORKS`.
 *
 * Borrowed straight from print: it gives the page a running order, so a reader who
 * lands mid-scroll knows where they are in the argument rather than meeting a wall of
 * unrelated headings. It also gives each section a small, quiet anchor above the
 * display type, which is what stops a page of large headings from feeling flat.
 *
 * Decorative in the sense that the heading below always carries the real meaning — but
 * not `aria-hidden`, because the number is genuinely useful when skimming by headings.
 */
export default function SectionLabel({
  index,
  children,
  className = "",
  align = "left",
}: {
  /** 1-based position in the page's running order. */
  index: number;
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <p
      className={`flex items-center gap-3 font-body text-mono-caps uppercase text-on-surface-variant ${
        align === "center" ? "justify-center" : ""
      } ${className}`}
    >
      <span className="font-bold text-primary">{String(index).padStart(2, "0")}</span>
      <span aria-hidden="true" className="block h-px w-8 bg-outline" />
      <span>{children}</span>
    </p>
  );
}
