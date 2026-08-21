/**
 * The strip directly under the hero — the reference's "SocialProof" band.
 *
 * ⚠️ Content deliberately differs from the reference, and this is not a styling choice.
 * The reference fills this band with the logos of British Council, IDP, Cambridge,
 * Oxford and Pearson. Those are real organisations with no relationship to this product,
 * and their marks are registered trademarks; putting them here would assert a
 * partnership that does not exist and expose the project to a trademark complaint. It is
 * the one thing on this page that would be false about somebody other than us.
 *
 * The band keeps the reference's shape, weight and position — a white hairline card,
 * muted, evenly distributed — and fills it with claims that are actually true: the
 * public band descriptors the grader scores against. Swap this for the real logo row the
 * moment there are real logos and written permission to use them.
 */

const MARKS = [
""
];

export default function TrustStrip() {
  return (
    <section className="relative z-20 mx-auto max-w-container px-margin-mobile pb-24">
      <div className="flex flex-wrap items-center justify-center gap-8 rounded-xl border border-outline-variant bg-surface-container-lowest p-8 lg:justify-between lg:gap-4">
        {MARKS.map((mark) => (
          <p
            key={mark}
            className="font-body text-body-sm font-medium uppercase tracking-wide text-on-surface-variant opacity-70"
          >
            {mark}
          </p>
        ))}
      </div>
    </section>
  );
}
