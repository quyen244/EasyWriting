import DisabledLink from "@/components/ui/DisabledLink";
import { Star } from "@/components/ui/Sticker";
import { FOOTER_COLUMNS } from "@/lib/navigation";

/**
 * Persistent public footer (Figma node 1001:546).
 *
 * Most of the design's footer entries point at pages that have never been written. They
 * render through `DisabledLink` rather than as anchors, because a footer full of
 * plausible links into 404s is the most common way a redesigned marketing page acquires
 * the silent dead ends SC-005 forbids.
 *
 * Two departures from the design, both deliberate:
 *  - the copyright year is computed rather than hard-coded to 2024, which the design
 *    frame shows and which would be wrong the moment this shipped;
 *  - the estimates disclaimer is added. Constitution TP-1 requires bands be presented
 *    as provisional, and a visitor who never opens the FAQ should still meet that
 *    statement somewhere.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-outline-variant bg-surface-container-low pb-10 pt-20">
      <Star className="absolute left-10 top-10 size-8 text-[#facc15] opacity-60" />

      <div className="mx-auto max-w-container px-margin-mobile">
        <h2 className="font-display text-display-lg-mobile leading-tight text-on-surface md:text-[60px] md:leading-[60px]">
          Write better.
          <br />
          <em className="italic text-on-surface-variant">Think clearer.</em>
          <br />
          <em className="italic text-primary">Score higher.</em>
        </h2>

        <div className="mt-12 grid gap-8 border-b border-outline-variant pb-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex size-8 items-center justify-center rounded bg-primary-container font-body text-[20px] font-bold leading-none text-on-primary-container"
              >
                W
              </span>
              <span className="font-body text-[20px] font-bold tracking-[-0.5px] text-on-surface">
                WriteWise
              </span>
            </p>
            <p className="mt-6 max-w-xs font-body text-body-sm text-on-surface-variant">
              Examiner-grade IELTS Writing feedback, in the time it takes to make a coffee.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="font-body text-body-md font-bold text-on-surface">{column.title}</h3>
              <ul className="mt-4 flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <DisabledLink
                      {...link}
                      className="font-body text-body-md text-on-surface-variant transition-colors hover:text-on-surface"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-2xl font-body text-body-sm text-on-surface-variant">
          Band scores are AI-generated estimates for practice only. They are not official or
          certified IELTS results, and IELTS is not affiliated with WriteWise.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 font-body text-body-sm text-on-surface-variant">
          <p>© {year} WriteWise. All rights reserved.</p>
          <p>Made with AI.</p>
        </div>
      </div>
    </footer>
  );
}
