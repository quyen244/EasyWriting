import type { Metadata } from "next";
import { Suspense } from "react";

import AuthScreen from "@/components/auth/AuthScreen";

export const metadata: Metadata = { title: "Sign up" };

/** Sign up — the same screen as `/signin`, in its other mode. */

/**
 * `AuthScreen` reads `?redirect` from the URL, and `useSearchParams` opts a route into
 * client rendering unless it sits inside a Suspense boundary. The fallback is null
 * rather than a skeleton: the boundary resolves in the same tick, and a flash of
 * placeholder would be more visible than the gap it fills.
 */
export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <AuthScreen mode="signup" />
    </Suspense>
  );
}
