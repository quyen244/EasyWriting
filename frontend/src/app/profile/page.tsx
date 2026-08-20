"use client";

/**
 * Profile page (002 T035, US3).
 *
 * Sign-out returns to the landing page (FR-009) via a full-page navigation. That is not
 * a stylistic choice — a client-side `router.replace("/")` does not work here, and the
 * E2E test proves it: `signOut()` flips auth state to "unauthenticated" while this page
 * is still mounted inside `ProtectedRoute`, whose effect fires immediately and sends the
 * learner to `/signin`. The guard wins the race, and FR-009 is violated.
 *
 * A hard navigation tears the React tree down before the guard can react, and it also
 * drops the in-memory access token — which, for a sign-out, is the behaviour you want
 * regardless.
 */

import Link from "next/link";
import { useState } from "react";

import ProtectedRoute from "@/components/ProtectedRoute";
import ProfileView from "@/components/profile/ProfileView";
import { useAuth } from "@/hooks/useAuth";

function Profile() {
  const { account, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      // `useAuth.signOut` ends the local session even when the network call fails, so
      // the learner is signed out either way and this navigation is always correct.
      //
      // The Next lint rule below prefers `router.push()` for internal navigation. That
      // is exactly what this code used to do, and it produced the FR-009 failure the
      // E2E test caught: a client-side navigation keeps the React tree alive long enough
      // for the still-mounted ProtectedRoute to see "unauthenticated" and redirect to
      // /signin instead. The rule optimises for navigation speed; correctness wins.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-outline-variant">
        <div className="mx-auto flex max-w-container items-center justify-between gap-4 px-margin-mobile py-4 md:px-margin-desktop">
          <Link href="/" className="font-display text-headline-sm text-on-surface">
            WriteWise
          </Link>
          <Link
            href="/workspace"
            className="rounded border border-outline-variant px-3 py-2 font-body text-body-sm text-on-surface-variant transition-colors hover:border-outline hover:text-on-surface"
          >
            Back to workspace
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-margin-mobile py-stack-lg">
        <h1 className="font-display text-headline-md text-on-surface">Your account</h1>
        <div className="mt-stack-md">
          {account ? (
            <ProfileView
              account={account}
              onSignOut={handleSignOut}
              signingOut={signingOut}
            />
          ) : (
            // Reachable only in the narrow window where the session is authenticated but
            // the account object has not landed yet.
            <p role="status" className="font-body text-body-md text-on-surface-variant">
              Loading your account details…
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  );
}
