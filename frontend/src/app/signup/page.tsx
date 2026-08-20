import type { Metadata } from "next";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Create your account" };

/** Sign-up page (002 T017). Calls `003`'s signUp(), then lands on the workspace. */
export default function SignUpPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-md px-margin-mobile py-stack-lg">
        <h1 className="font-display text-headline-md text-on-surface">Create your account</h1>
        <p className="mt-stack-sm font-body text-body-md text-on-surface-variant">
          One essay a day, scored in full, free.
        </p>
        <div className="mt-stack-lg">
          <AuthForm mode="signup" />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
