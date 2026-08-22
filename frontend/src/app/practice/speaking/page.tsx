"use client";

import AppShell from "@/components/app/AppShell";
import ComingSoon from "@/components/app/ComingSoon";
import ProtectedRoute from "@/components/ProtectedRoute";

/** Practice → Speaking: a designed placeholder, not an empty route. */
export default function PracticeSpeakingPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ComingSoon titleKey="soon.practiceTitle" bodyKey="soon.practiceBody" />
      </AppShell>
    </ProtectedRoute>
  );
}
