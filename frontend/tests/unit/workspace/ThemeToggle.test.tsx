import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import ThemeToggle from "@/components/workspace/ThemeToggle";
import { STORAGE_KEY } from "@/lib/theme";

describe("ThemeToggle", () => {
  it("persists the chosen theme to localStorage (FR-018)", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole("button"));
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
  });

  it("applies the dark class to <html>", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole("button"));
    expect(document.documentElement).toHaveClass("dark");
  });

  it("toggles back to light", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    await user.click(button);
    await user.click(button);
    expect(document.documentElement).not.toHaveClass("dark");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
  });

  it("restores the stored preference on mount", () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    render(<ThemeToggle />);
    expect(document.documentElement).toHaveClass("dark");
  });

  it("announces the action it will perform, not the current state", async () => {
    // "Dark mode" as a label is ambiguous — a screen-reader user cannot tell whether it
    // reports the current theme or the one the button switches to.
    const user = userEvent.setup();
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /switch to dark/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button", { name: /switch to light/i })).toBeInTheDocument();
  });
});
