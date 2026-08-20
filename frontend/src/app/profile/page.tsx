"use client";

/**
 * Profile page (002 T035, US3).
 *
 * Sign-out redirects to `/` (FR-009). It uses `router.replace`, not `push`: after
 * signing out the workspace must not be reachable with the back button, which FR-010
 * requires. The `ProtectedRoute` guard would bounce a back-navigation anyway, but
 * leaving the entry in history means the learner sees a flash of the guard's loading
 * state instead of simply staying on the landing page.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import ProtectedRoute from "@/components/ProtectedRoute";
import ProfileView from "@/components/profile/ProfileView";
import { useAuth } from "@/hooks/useAuth";

function Profile() {
  const { account, signOut } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      // `useAuth.signOut` already ends the local session even when the network call
      // fails, so the learner is signed out either way and the redirect is correct.
      router.replace("/");
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
