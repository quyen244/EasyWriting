"use client";

/**
 * Client-side auth guard (002 T002, research.md decision 1, contracts/page-routes.md).
 *
 * This is a client guard rather than Next.js middleware for a reason that is not a
 * preference: `003` scopes the refresh-token cookie to the backend's own domain, and the
 * access token is deliberately never persisted to a cookie at all. Middleware runs on a
 * different origin and can see neither. The only place that can answer "is this learner
 * signed in" is client JS, after `useAuth` has resolved.
 *
 * The three-state flow matters. `checking` is not "signed out": a returning visitor with
 * a valid refresh cookie passes through it on every page load, so redirecting there
 * would sign out every returning learner. And children must not render during it —
 * SC-004 requires that protected content never reach the DOM for an unauthenticated
 * visitor, which "render then hide" would violate.
 */

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/signin");
    }
  }, [status, router]);

  if (status === "authenticated") {
    return <>{children}</>;
  }

  if (status === "checking") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[60vh] items-center justify-center"
      >
        <span className="flex items-center gap-3 text-body-md text-on-surface-variant">
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-outline-variant border-t-primary"
          />
          Checking your session…
        </span>
      </div>
    );
  }

  // Unauthenticated: the redirect is already scheduled. Render nothing rather than a
  // flash of "access denied" copy the learner cannot act on.
  return null;
}
