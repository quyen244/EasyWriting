import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Sidebar from "@/components/app/Sidebar";

import { render, screen } from "../support/render";

/**
 * The sidebar, driven by the route it is given.
 *
 * The interesting behaviour is not that it renders links — it is that a learner can
 * always tell where they are, and that a group does not collapse under them when they
 * navigate inside it.
 */

function renderSidebar(pathname: string, onSignOut = vi.fn()) {
  render(
    <Sidebar
      pathname={pathname}
      email="learner@writewise.app"
      onSignOut={onSignOut}
      signingOut={false}
    />,
  );
  return { onSignOut };
}

describe("Sidebar", () => {
  it("links the logo back to the landing page", () => {
    renderSidebar("/workspace");
    expect(screen.getByRole("link", { name: "WriteWise" })).toHaveAttribute("href", "/");
  });

  it("marks the current page, and only the current page", () => {
    renderSidebar("/workspace");

    const current = screen.getAllByRole("link", { current: "page" });
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute("href", "/workspace");
  });

  it("opens the group containing the current page", () => {
    // A learner who arrived at Practice → Writing should see Practice already open;
    // making them expand the group they are standing in is a small, constant insult.
    renderSidebar("/practice/writing");

    expect(screen.getByRole("button", { name: /practice/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    // Exact, because "Grade Writing" also contains the word.
    expect(screen.getByRole("link", { name: "Writing" })).toHaveAttribute(
      "href",
      "/practice/writing",
    );
  });

  it("keeps a group closed when the learner is elsewhere", () => {
    renderSidebar("/workspace");
    expect(screen.getByRole("button", { name: /mock test/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("expands and collapses a group on demand", async () => {
    const user = userEvent.setup();
    renderSidebar("/workspace");

    const mockTest = screen.getByRole("button", { name: /mock test/i });
    await user.click(mockTest);
    expect(mockTest).toHaveAttribute("aria-expanded", "true");

    await user.click(mockTest);
    expect(mockTest).toHaveAttribute("aria-expanded", "false");
  });

  it("highlights the deepest match when inside an exercise", () => {
    renderSidebar("/practice/writing/t2_essay_outline");
    const current = screen.getAllByRole("link", { current: "page" });
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute("href", "/practice/writing");
  });

  it("shows the signed-in email beside the account link", () => {
    renderSidebar("/account");
    expect(screen.getByText("learner@writewise.app")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /account/i })).toHaveAttribute(
      "href",
      "/account",
    );
  });

  it("calls sign-out rather than navigating", async () => {
    const user = userEvent.setup();
    const { onSignOut } = renderSidebar("/workspace");

    await user.click(screen.getByRole("button", { name: /log out/i }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it("carries the language and theme controls", () => {
    renderSidebar("/workspace");
    expect(screen.getByRole("button", { name: "VI" })).toBeEnabled();
    expect(screen.getByRole("button", { name: /dark theme/i })).toBeInTheDocument();
  });

  it("sends Support to the FAQ rather than a second, emptier page", () => {
    renderSidebar("/workspace");
    expect(screen.getByRole("link", { name: /support/i })).toHaveAttribute("href", "/faq");
  });
});
