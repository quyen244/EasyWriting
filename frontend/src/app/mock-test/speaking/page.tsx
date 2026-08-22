"use client";

import AppShell from "@/components/app/AppShell";
import ComingSoon from "@/components/app/ComingSoon";
import ProtectedRoute from "@/components/ProtectedRoute";

/** Mock Test → Speaking. Same visual language as Practice → Speaking, by design. */
export default function MockSpeakingPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ComingSoon titleKey="soon.mockTitle" bodyKey="soon.mockBody" />
      </AppShell>
    </ProtectedRoute>
  );
}
