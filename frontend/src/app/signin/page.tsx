import type { Metadata } from "next";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Sign in" };

/** Sign-in page (002 T018). Calls `003`'s signIn(), then lands on the workspace. */
export default function SignInPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-md px-margin-mobile py-stack-lg">
        <h1 className="font-display text-headline-md text-on-surface">Sign in</h1>
        <p className="mt-stack-sm font-body text-body-md text-on-surface-variant">
          Welcome back.
        </p>
        <div className="mt-stack-lg">
          <AuthForm mode="signin" />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
