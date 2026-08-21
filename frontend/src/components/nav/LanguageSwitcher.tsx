/**
 * The `[VI]` locale control.
 *
 * There is no i18n in this project — no locale routing, no message catalogue, no second
 * translation of any string. So this renders `disabled` rather than as a live control:
 * a switcher that silently does nothing is worse than one that says it is not ready,
 * and `disabled` also keeps it out of the tab order instead of handing keyboard users a
 * stop that goes nowhere.
 *
 * Wire this up when locales land: it becomes the trigger for the locale menu, and the
 * label reads from the active locale rather than being hard-coded.
 */
export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      disabled
      title="Vietnamese interface — coming soon"
      className={`rounded border border-outline-variant px-2.5 py-1 font-body text-[12px] font-bold tracking-wide text-on-surface-variant opacity-70 ${className}`}
    >
      VI
      <span className="sr-only"> — language switching is not available yet</span>
    </button>
  );
}
