"use client";

/**
 * The marketing header's locale control.
 *
 * It used to render `disabled` with a "coming soon" title, because there was no i18n in
 * the project — no catalogue, no second translation of anything. There is now, so this
 * is the real control: the same `LocaleToggle` the authenticated product uses, so the
 * switch behaves identically on both sides of the sign-in boundary.
 *
 * Note that the marketing page's own copy is not translated. The control still belongs
 * here: it sets the preference a visitor carries into the product, and hiding it until
 * the landing page is translated would leave a Vietnamese learner no way to set it
 * before signing up.
 */

import { LocaleToggle } from "@/components/app/PreferenceControls";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      <LocaleToggle />
    </span>
  );
}
