/**
 * "WriteWise vs. Traditional Methods" (Figma node 1001:120).
 *
 * The design is three offset, tilted cards with hard black shadows rather than a grid,
 * so this is not a `<table>`: there is no shared row axis to announce. It is three
 * lists, each headed by what it describes, which is what a screen reader can actually
 * make sense of here.
 *
 * Every WriteWise claim below is one 001-ielts-score-assessment actually ships
 * (FR-011). "Grammar & vocab fixes" is the design's wording and is kept, because the
 * grader does comment on grammar and lexis per criterion — it is a description of the
 * feedback, not a promise of automatic rewriting.
 */

const TRADITIONAL = [
  "Takes 2-5 days for feedback",
  "Expensive ($20-$50 per essay)",
  "Subjective scoring",
];

const OTHER_AI = ["Generic grammar checks", "Not IELTS aligned", "Inaccurate band scores"];

const WRITEWISE = [
  "Instant feedback (< 1 min)",
  "Affordable subscription",
  "Objective scoring",
  "Grammar & vocab fixes",
];

export default function ComparisonTable() {
  return (
    <section className="bg-surface-variant py-section-y">
      <div className="mx-auto max-w-container px-margin-mobile">
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 className="font-display text-display-xl-mobile text-on-surface md:text-display-xl">
            WriteWise <em className="italic">vs.</em> Traditional Methods
          </h2>
          <p className="max-w-prose font-body text-body-xl font-medium text-on-surface-variant">
            See why students are switching to AI-powered evaluations.
          </p>
        </div>

        <div className="mt-16 flex flex-col items-center gap-6 lg:flex-row lg:items-stretch">
          <article
            data-tilt
            className="relative z-10 flex-1 -rotate-2 rounded-2xl border-2 border-ink bg-accent-green-soft p-8 shadow-brutal"
          >
            <h3 className="font-display text-headline-sm text-on-surface">Traditional Teacher</h3>
            <ul className="mt-6 flex flex-col gap-4">
              {TRADITIONAL.map((item) => (
                <li key={item} className="flex gap-3 font-body text-body-md font-medium text-on-surface">
                  <span aria-hidden="true" className="text-error">
                    ✕
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>

          {/* Centrepiece — deliberately larger and ordered first on small screens */}
          <article className="relative z-20 order-first flex-1 rounded-2xl border-4 border-primary bg-surface-container-lowest p-10 shadow-brutal-accent-soft lg:order-none lg:-translate-y-8 lg:scale-105">
            <span
              data-tilt
              className="absolute -top-6 left-1/2 w-max -translate-x-1/2 -rotate-2 rounded-md bg-inverse-surface px-6 py-2 font-body text-label-caps-lg uppercase text-inverse-on-surface"
            >
              Best choice
            </span>
            <h3 className="font-display text-headline-md text-primary">WriteWise</h3>
            <ul className="mt-8 flex flex-col gap-5">
              {WRITEWISE.map((item) => (
                <li key={item} className="flex gap-3 font-body text-body-lg font-bold text-on-surface">
                  <span aria-hidden="true" className="text-tertiary">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="/signup"
              className="mt-8 block rounded-md border-2 border-ink bg-primary-container px-8 py-4 text-center font-body text-body-md font-bold text-on-primary-container shadow-brutal-sm transition-transform hover:-translate-y-0.5"
            >
              Start Improving Now
            </a>
          </article>

          <article
            data-tilt
            className="relative z-10 flex-1 rotate-1 rounded-2xl border-2 border-ink bg-accent-blue-soft p-8 shadow-brutal"
          >
            <h3 className="font-display text-headline-sm text-on-surface">Other AI Tools</h3>
            <ul className="mt-6 flex flex-col gap-4">
              {OTHER_AI.map((item) => (
                <li key={item} className="flex gap-3 font-body text-body-md font-medium text-on-surface">
                  <span aria-hidden="true" className="font-bold text-accent-yellow">
                    !
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
