import type { Metadata } from "next";
import { Suspense } from "react";

import AuthScreen from "@/components/auth/AuthScreen";

export const metadata: Metadata = { title: "Log in" };

/**
 * Sign in.
 *
 * No `SiteHeader` and no `SiteFooter`: the marketing nav on an auth screen invites the
 * visitor to wander off mid-task, and the footer's twelve links are twelve ways to lose
 * someone who was about to sign in.
 */

/**
 * `AuthScreen` reads `?redirect` from the URL, and `useSearchParams` opts a route into
 * client rendering unless it sits inside a Suspense boundary. The fallback is null
 * rather than a skeleton: the boundary resolves in the same tick, and a flash of
 * placeholder would be more visible than the gap it fills.
 */
export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <AuthScreen mode="signin" />
    </Suspense>
  );
}
