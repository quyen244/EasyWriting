import { describe, expect, it } from "vitest";

import { FAQ_CATEGORIES, FAQ_ENTRIES } from "@/lib/faqData";

describe("FAQ content", () => {
  it("covers the three categories FR-013 names", () => {
    expect(FAQ_CATEGORIES).toEqual(["Getting Started", "Account & Login", "Essay Scoring"]);
    for (const category of FAQ_CATEGORIES) {
      expect(FAQ_ENTRIES.some((e) => e.category === category)).toBe(true);
    }
  });

  it("uses unique ids, which the open/close state depends on", () => {
    const ids = FAQ_ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("states unambiguously that the score is not official (FR-015)", () => {
    const entry = FAQ_ENTRIES.find((e) => e.id === "is-the-score-official");
    expect(entry?.category).toBe("Essay Scoring");
    expect(entry?.answer).toMatch(/\bnot an official\b/i);
    expect(entry?.answer).toMatch(/AI-generated/i);
    // "No." must be the first word — an answer that qualifies before it denies is
    // exactly the ambiguity FR-015 exists to prevent.
    expect(entry?.answer.trim().startsWith("No.")).toBe(true);
  });
});

describe("FAQ content does not claim capabilities that do not exist", () => {
  it("does not offer Google sign-in, which 003 does not implement", () => {
    const entry = FAQ_ENTRIES.find((e) => e.id === "google-sign-in");
    expect(entry?.answer).toMatch(/not yet|not available/i);
    expect(entry?.answer).not.toMatch(/\bsupports (SSO|Single Sign-On)\b/i);
  });

  it("does not point a locked-out learner at a password-reset link that does not exist", () => {
    // Verified against the backend's OpenAPI document: auth exposes signup, signin,
    // signout, refresh and me. There is no reset endpoint and no reset page.
    const entry = FAQ_ENTRIES.find((e) => e.id === "forgot-password");
    expect(entry?.answer).toMatch(/not built yet|no reset link/i);
    expect(entry?.answer).not.toMatch(/click the .?forgot password.? link/i);
  });

  it("is honest that sentence-level corrections are not shipped", () => {
    // Consistent with FR-003 marking "Learn the fix" as future, and with 001's API,
    // which returns per-criterion explanations and no per-sentence corrections.
    const entry = FAQ_ENTRIES.find((e) => e.id === "line-by-line");
    expect(entry?.answer).toMatch(/not yet/i);
  });

  it("never advertises SSO anywhere in the content", () => {
    const all = FAQ_ENTRIES.map((e) => e.answer).join(" ");
    expect(all).not.toMatch(/we support (google|sso)/i);
  });
});
