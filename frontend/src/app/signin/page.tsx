import type { Metadata } from "next";

import AuthScreen from "@/components/auth/AuthScreen";

export const metadata: Metadata = { title: "Log in" };

/**
 * Sign in.
 *
 * No `SiteHeader` and no `SiteFooter`: the marketing nav on an auth screen invites the
 * visitor to wander off mid-task, and the footer's twelve links are twelve ways to lose
 * someone who was about to sign in.
 */
export default function SignInPage() {
  return <AuthScreen mode="signin" />;
}
