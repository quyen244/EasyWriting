/**
 * The three frictions of traditional IELTS preparation (002 T011, FR-002).
 *
 * FR-002 names these three specifically — slow feedback, vague comments, cost — so the
 * set is fixed rather than editorial.
 */

const FRICTIONS = [
  {
    title: "Slow feedback loop",
    body: "Waiting days for a marked essay breaks the link between writing something and learning why it did not work.",
  },
  {
    title: "Vague comments",
    body: "“Improve your vocabulary” is not actionable. You need to know which sentence, against which criterion, and why.",
  },
  {
    title: "Prohibitive cost",
    body: "Good tutors charge premium hourly rates, which caps how many essays you can practise before test day.",
  },
];

export default function ProblemSection() {
  return (
    <section className="border-y border-outline-variant bg-surface-container-low">
      <div className="mx-auto max-w-container px-margin-mobile py-stack-lg md:px-margin-desktop">
        <h2 className="font-display text-headline-md text-on-surface">
          The barrier to a Band 7+
        </h2>
        <p className="mt-stack-sm max-w-2xl font-body text-body-md text-on-surface-variant">
          It is rarely a lack of effort. It is that the feedback loop is too slow and too
          vague to act on.
        </p>

        <div className="mt-stack-md grid gap-gutter md:grid-cols-3">
          {FRICTIONS.map((friction) => (
            <article key={friction.title}>
              <h3 className="font-display text-headline-sm text-on-surface">{friction.title}</h3>
              <p className="mt-stack-sm font-body text-body-md text-on-surface-variant">
                {friction.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
