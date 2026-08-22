import type { Metadata } from "next";

import AuthScreen from "@/components/auth/AuthScreen";

export const metadata: Metadata = { title: "Sign up" };

/** Sign up — the same screen as `/signin`, in its other mode. */
export default function SignUpPage() {
  return <AuthScreen mode="signup" />;
}
