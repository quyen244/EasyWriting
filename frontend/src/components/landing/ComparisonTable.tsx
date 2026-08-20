/**
 * WriteWise vs. a traditional tutor (002 T012, FR-002).
 *
 * Rendered as a real `<table>`, not the mockup's grid of styled divs: this is tabular
 * data, and a div grid leaves a screen-reader user unable to tell which value belongs
 * to which column.
 */

const ROWS: Array<{ dimension: string; writewise: string; tutor: string }> = [
  {
    dimension: "Turnaround time",
    writewise: "Under 60 seconds",
    tutor: "3–5 days",
  },
  {
    dimension: "Feedback detail",
    writewise: "Per-criterion, quoted from your essay",
    tutor: "General end-of-essay notes",
  },
  {
    dimension: "Cost per essay",
    writewise: "Free daily, or cents on a paid plan",
    tutor: "$20–$50+",
  },
  {
    dimension: "Availability",
    writewise: "Any time, no booking",
    tutor: "Subject to scheduling",
  },
];

export default function ComparisonTable() {
  return (
    <section className="mx-auto max-w-container px-margin-mobile py-stack-lg md:px-margin-desktop">
      <h2 className="font-display text-headline-md text-on-surface">
        How WriteWise compares
      </h2>
      <p className="mt-stack-sm font-body text-body-md text-on-surface-variant">
        Not a replacement for a good teacher — a way to get the mechanical feedback
        immediately, so their time goes to the parts that need a human.
      </p>

      <div className="mt-stack-md overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left font-body">
          <thead>
            <tr className="border-b border-outline-variant">
              <th scope="col" className="py-3 pr-4 text-label-caps uppercase text-on-surface-variant">
                Feature
              </th>
              <th scope="col" className="py-3 pr-4 text-label-caps uppercase text-primary">
                WriteWise
              </th>
              <th scope="col" className="py-3 text-label-caps uppercase text-on-surface-variant">
                Traditional tutors
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.dimension} className="border-b border-outline-variant">
                <th
                  scope="row"
                  className="py-4 pr-4 text-body-md font-medium text-on-surface"
                >
                  {row.dimension}
                </th>
                <td className="py-4 pr-4 text-body-md text-on-surface">{row.writewise}</td>
                <td className="py-4 text-body-md text-on-surface-variant">{row.tutor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
