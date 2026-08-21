import DisabledLink from "@/components/ui/DisabledLink";
import { Star } from "@/components/ui/Sticker";
import { FOOTER_COLUMNS } from "@/lib/navigation";

/**
 * Persistent public footer — cloned from the reference's footer: the three-line
 * statement set large in Playfair, then the brand column and three link columns above a
 * hairline rule.
 *
 * Most of the reference's footer entries point at pages that have never been written.
 * They render through `DisabledLink` rather than as anchors, because a footer full of
 * plausible links into 404s is the most common way a redesigned marketing page acquires
 * the silent dead ends SC-005 forbids. That is the one structural difference from the
 * reference, which wires all nine to `href="#"`.
 *
 * Two smaller departures, both deliberate:
 *  - the copyright year is computed rather than hard-coded to 2024, which the reference
 *    shows and which would already be wrong;
 *  - the estimates disclaimer is added. Constitution TP-1 requires bands be presented as
 *    provisional, and a visitor who never opens the FAQ should still meet that somewhere.
 *
 * The reference's two social links point at `#`. They are omitted rather than shipped as
 * placeholder icons that go nowhere — add them back with real profile URLs.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-outline-variant bg-surface-container-low pb-10 pt-20">
      <Star className="absolute left-10 top-10 size-8 text-[#facc15] opacity-50" />

      <div className="mx-auto max-w-container px-margin-mobile">
        <div className="mb-16 text-center lg:text-left">
          <h2 className="font-display text-display-lg-mobile leading-tight text-on-surface md:text-[60px] md:leading-[60px]">
            Write better.
            <br />
            <em className="italic text-on-surface-variant">Think clearer.</em>
            <br />
            <span className="text-primary">Score higher.</span>
          </h2>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-8 border-b border-outline-variant pb-12 md:grid-cols-4">
          <div className="text-center md:text-left">
            <p className="mb-6 flex items-center justify-center gap-2 md:justify-start">
              <span
                aria-hidden="true"
                className="flex size-8 items-center justify-center rounded bg-primary-container font-body text-[20px] font-bold leading-none text-on-primary-container"
              >
                W
              </span>
              <span className="font-body text-[20px] font-bold tracking-tight text-on-surface">
                WriteWise
              </span>
            </p>
            <p className="font-body text-body-sm text-on-surface-variant">
              Examiner-grade IELTS Writing feedback, in the time it takes to make a coffee.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="text-center md:text-left">
              <h3 className="mb-4 font-body text-body-md font-bold text-on-surface">
                {column.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <DisabledLink
                      {...link}
                      className="font-body text-body-md text-on-surface-variant transition-colors hover:text-primary"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mb-6 max-w-2xl font-body text-body-sm text-on-surface-variant">
          Band scores are AI-generated estimates for practice only. They are not official or
          certified IELTS results, and IELTS is not affiliated with WriteWise.
        </p>

        <div className="flex flex-col items-center justify-between gap-2 font-body text-body-sm text-on-surface-variant md:flex-row">
          <p>© {year} WriteWise. All rights reserved.</p>
          <p>Made with AI.</p>
        </div>
      </div>
    </footer>
  );
}
