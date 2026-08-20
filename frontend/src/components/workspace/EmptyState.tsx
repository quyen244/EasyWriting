/**
 * First-run guidance for the workspace (002 T026, FR-007).
 *
 * SC-005 requires a first-time learner to work out what to do without help, so this
 * names the action and sets a time expectation rather than just reporting emptiness.
 */
export default function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low p-6">
      <h2 className="font-display text-headline-sm text-on-surface">
        No score yet
      </h2>
      <p className="mt-stack-sm font-body text-body-md text-on-surface-variant">
        Paste an essay into the editor and choose the task type. Scoring takes under a
        minute, and usually a few seconds.
      </p>
      <p className="mt-stack-sm font-body text-body-sm text-on-surface-variant">
        You will get a band for each of the four official criteria, each one explained and
        quoted from your own writing.
      </p>
    </div>
  );
}
