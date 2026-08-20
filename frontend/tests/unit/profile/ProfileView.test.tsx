import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ProfileView from "@/components/profile/ProfileView";
import type { Account } from "@/lib/auth";

const ACCOUNT: Account = {
  id: "8f14e45f-ceea-467a-9575-4a4c0dcd88b1",
  email: "learner@example.com",
  display_name: "Mai Nguyen",
};

describe("ProfileView", () => {
  it("shows the display name and email (FR-008)", () => {
    render(<ProfileView account={ACCOUNT} onSignOut={vi.fn()} signingOut={false} />);
    expect(screen.getByText("Mai Nguyen")).toBeInTheDocument();
    expect(screen.getByText("learner@example.com")).toBeInTheDocument();
  });

  it("labels each value so an email is not mistaken for a name", () => {
    render(<ProfileView account={ACCOUNT} onSignOut={vi.fn()} signingOut={false} />);
    expect(screen.getByText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByText(/display name/i)).toBeInTheDocument();
  });

  it("is view-only — no editable fields (FR-012)", () => {
    render(<ProfileView account={ACCOUNT} onSignOut={vi.fn()} signingOut={false} />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("does not expose the internal account id", () => {
    // Meaningless to the learner and an unnecessary identifier to leak into a screenshot.
    render(<ProfileView account={ACCOUNT} onSignOut={vi.fn()} signingOut={false} />);
    expect(screen.queryByText(ACCOUNT.id)).not.toBeInTheDocument();
  });

  it("falls back gracefully when the account has no display name", () => {
    // `003` makes display_name optional at sign-up, so an empty string is a real case.
    render(
      <ProfileView
        account={{ ...ACCOUNT, display_name: "" }}
        onSignOut={vi.fn()}
        signingOut={false}
      />,
    );
    expect(screen.getByText(/not set/i)).toBeInTheDocument();
    expect(screen.getByText("learner@example.com")).toBeInTheDocument();
  });

  it("offers sign-out (FR-009, SC-003)", async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();
    render(<ProfileView account={ACCOUNT} onSignOut={onSignOut} signingOut={false} />);

    await user.click(screen.getByRole("button", { name: /sign out/i }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it("disables sign-out while it is in progress", () => {
    render(<ProfileView account={ACCOUNT} onSignOut={vi.fn()} signingOut />);
    expect(screen.getByRole("button", { name: /signing out/i })).toBeDisabled();
  });
});
