import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ThemeToggle from "@/components/workspace/ThemeToggle";
import { STORAGE_KEY, THEME_INIT_SCRIPT } from "@/lib/theme";

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

  it("reflects a theme that was already applied before it mounted", () => {
    // Applying the stored preference on load is the root layout's inline script's job
    // (see THEME_INIT_SCRIPT below) — it has to happen before first paint, which is
    // earlier than any component can run. The toggle's responsibility is to read the
    // result and label itself correctly.
    document.documentElement.classList.add("dark");
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /switch to light/i })).toBeInTheDocument();
  });
});

describe("THEME_INIT_SCRIPT", () => {
  function run() {
    new Function(THEME_INIT_SCRIPT)();
  }

  it("applies a stored dark preference before React ever renders", () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    run();
    expect(document.documentElement).toHaveClass("dark");
  });

  it("leaves the document in light theme when nothing is stored", () => {
    run();
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("does not throw when localStorage is unavailable", () => {
    // If this script throws, it runs in <head> and takes the whole page down with it.
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(() => run()).not.toThrow();
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
