/**
 * Account details, view-only (002 T034, FR-008 / FR-012).
 *
 * Presentational on purpose: the page owns the sign-out call and the redirect, so this
 * stays trivially testable without mocking auth or navigation.
 */

import type { Account } from "@/lib/auth";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-outline-variant py-4">
      <dt className="text-label-caps uppercase text-on-surface-variant">{label}</dt>
      <dd className="mt-1 font-body text-body-md text-on-surface">{value}</dd>
    </div>
  );
}

export default function ProfileView({
  account,
  onSignOut,
  signingOut,
}: {
  account: Account;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  return (
    <div>
      <dl>
        {/* `003` makes display_name optional at sign-up, so an empty value is normal
            rather than an error — say so plainly instead of rendering a blank row. */}
        <Field label="Display name" value={account.display_name || "Not set"} />
        <Field label="Email" value={account.email} />
      </dl>

      <button
        type="button"
        onClick={onSignOut}
        disabled={signingOut}
        className="mt-stack-lg rounded border border-primary px-5 py-2.5 font-body text-body-md font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
