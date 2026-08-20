import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEY, applyTheme, readStoredTheme, toggleTheme, writeTheme } from "@/lib/theme";

describe("readStoredTheme", () => {
  it("defaults to light when nothing was ever stored", () => {
    expect(readStoredTheme()).toBe("light");
  });

  it("returns the stored preference", () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    expect(readStoredTheme()).toBe("dark");
  });

  it("falls back to light on a corrupted value rather than throwing", () => {
    // A user editing localStorage by hand, or an older build writing a different
    // encoding, must not break the page on load.
    localStorage.setItem(STORAGE_KEY, "sepia");
    expect(readStoredTheme()).toBe("light");
  });
});

describe("applyTheme", () => {
  it("adds the dark class for dark", () => {
    applyTheme("dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("removes the dark class for light", () => {
    document.documentElement.classList.add("dark");
    applyTheme("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("is idempotent", () => {
    applyTheme("dark");
    applyTheme("dark");
    expect(document.documentElement.className.match(/dark/g)).toHaveLength(1);
  });
});

describe("writeTheme", () => {
  it("persists and applies in one step", () => {
    writeTheme("dark");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
  });
});

describe("toggleTheme", () => {
  it("flips light to dark and back, persisting each time", () => {
    expect(toggleTheme()).toBe("dark");
    expect(readStoredTheme()).toBe("dark");
    expect(toggleTheme()).toBe("light");
    expect(readStoredTheme()).toBe("light");
  });
});

describe("resilience to an unavailable localStorage", () => {
  beforeEach(() => {
    // Safari private mode and some embedded webviews throw on access rather than
    // returning null. Losing the preference is acceptable; a crashed page is not.
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
  });

  it("reads fall back to light instead of throwing", () => {
    expect(() => readStoredTheme()).not.toThrow();
    expect(readStoredTheme()).toBe("light");
  });

  it("writes still apply the class even though persistence failed", () => {
    expect(() => writeTheme("dark")).not.toThrow();
    expect(document.documentElement).toHaveClass("dark");
  });
});
