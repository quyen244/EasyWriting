"use client";

/**
 * Client-side auth guard — the fallback, not the guard.
 *
 * This used to be the only guard, for a reason that has since expired: the retired
 * backend scoped its refresh cookie to another domain, so middleware could not see a
 * session and only client JS could answer "is this learner signed in".
 *
 * With Supabase the session lives in a cookie this app's own middleware reads, so
 * `middleware.ts` decides before a page renders. Leaving a second guard running was not
 * harmless: on sign-out both fired at once, and this one's redirect aborted the
 * in-flight logout request and beat `AppShell` to the destination — the learner ended up
 * at /signin instead of the landing page, with the server-side session possibly still
 * open.
 *
 * So when Supabase is configured, this component gets out of the way. It still guards
 * mock mode, where there is no middleware to do it — a checkout without credentials
 * should not hand out the product to anyone who types /workspace.
 */

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSupabaseConfigured) return;
    if (status === "unauthenticated") {
      router.replace("/signin");
    }
  }, [status, router]);

  // The middleware already refused anyone without a session, so rendering is safe and a
  // spinner here would be the very flash the middleware exists to prevent.
  if (isSupabaseConfigured) {
    return <>{children}</>;
  }

  if (status === "authenticated") {
    return <>{children}</>;
  }

  if (status === "checking") {
    // `checking` is not "signed out": a returning visitor passes through it on every
    // load, so redirecting here would sign out every returning learner. Children must
    // not render during it either — protected content should never reach the DOM for a
    // visitor who turns out to be anonymous.
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
