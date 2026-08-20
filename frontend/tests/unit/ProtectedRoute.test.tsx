import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ProtectedRoute from "@/components/ProtectedRoute";

const replace = vi.fn();
// One stable object, matching how Next's real useRouter behaves. Returning a fresh
// object per call would change the effect's dependency identity on every render and
// make the guard look like it redirects in a loop when it does not.
const router = { replace, push: vi.fn(), prefetch: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

const mockAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockAuth(),
}));

function renderGuard() {
  return render(
    <ProtectedRoute>
      <p>secret learner content</p>
    </ProtectedRoute>,
  );
}

describe("ProtectedRoute", () => {
  it("renders a loading state, not the children, while the session is being checked", () => {
    // SC-004 is explicit that a signed-out visitor must never see a broken or
    // partially-loaded protected page. Rendering children first and hiding them later
    // would technically redirect, but the content would have already been in the DOM.
    mockAuth.mockReturnValue({ status: "checking", account: null, accessToken: null });
    renderGuard();

    expect(screen.queryByText("secret learner content")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("does not redirect while still checking", () => {
    replace.mockClear();
    mockAuth.mockReturnValue({ status: "checking", account: null, accessToken: null });
    renderGuard();

    // A returning visitor with a valid refresh cookie is briefly "checking". Bouncing
    // them to /signin here would sign out every returning learner on every page load.
    expect(replace).not.toHaveBeenCalled();
  });

  it("renders children once authenticated", () => {
    mockAuth.mockReturnValue({
      status: "authenticated",
      account: { id: "1", email: "a@b.com", display_name: "Mai" },
      accessToken: "token",
    });
    renderGuard();

    expect(screen.getByText("secret learner content")).toBeInTheDocument();
  });

  it("redirects to /signin when unauthenticated and renders nothing", async () => {
    replace.mockClear();
    mockAuth.mockReturnValue({ status: "unauthenticated", account: null, accessToken: null });
    renderGuard();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/signin"));
    expect(screen.queryByText("secret learner content")).not.toBeInTheDocument();
  });

  it("redirects only once even if the component re-renders", async () => {
    replace.mockClear();
    mockAuth.mockReturnValue({ status: "unauthenticated", account: null, accessToken: null });
    const { rerender } = renderGuard();
    rerender(
      <ProtectedRoute>
        <p>secret learner content</p>
      </ProtectedRoute>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledTimes(1));
  });
});
