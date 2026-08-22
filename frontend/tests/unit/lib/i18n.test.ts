import { describe, expect, it } from "vitest";

import { criterionLabel } from "@/lib/api";
import { en, interpolate, translate, vi as viCatalogue } from "@/lib/i18n";

/**
 * The parity test is the whole point of a keyed catalogue.
 *
 * TypeScript already forces `vi` to carry every key, but it cannot force the values to
 * be different from the English ones — and a "translation" that is a copy of the English
 * string is exactly the failure mode nobody notices until a Vietnamese learner reports
 * it. So the checks here are about content, not just shape.
 */
describe("message catalogues", () => {
  const keys = Object.keys(en) as (keyof typeof en)[];

  it("defines the same key set in both locales", () => {
    expect(Object.keys(viCatalogue).sort()).toEqual(keys.slice().sort());
  });

  it("leaves no key empty", () => {
    for (const key of keys) {
      expect(en[key], `en.${key}`).not.toBe("");
      expect(viCatalogue[key], `vi.${key}`).not.toBe("");
    }
  });

  it("actually translates the interface, rather than copying English across", () => {
    // A handful of strings are legitimately identical: brand names, "IELTS", "Task 1",
    // "Email", "Pipeline", and the language names themselves. Everything else being
    // identical would mean the catalogue was filled in but never translated.
    const identical = keys.filter((key) => en[key] === viCatalogue[key]);
    expect(identical.length).toBeLessThan(keys.length * 0.15);
  });

  it("never translates the brand name", () => {
    expect(viCatalogue["brand.name"]).toBe("WriteWise");
    for (const key of keys) {
      if (en[key].includes("WriteWise")) {
        expect(viCatalogue[key], `vi.${key} must keep the brand name`).toContain(
          "WriteWise",
        );
      }
    }
  });

  it("keeps every placeholder a string carries in English", () => {
    const placeholders = (value: string) =>
      (value.match(/\{(\w+)\}/g) ?? []).sort().join(",");

    for (const key of keys) {
      expect(placeholders(viCatalogue[key]), `vi.${key}`).toBe(placeholders(en[key]));
    }
  });
});

describe("interpolate", () => {
  it("fills named placeholders", () => {
    expect(interpolate("{count} / {minimum} words", { count: 243, minimum: 250 })).toBe(
      "243 / 250 words",
    );
  });

  it("leaves an unmatched placeholder visible rather than blanking it", () => {
    // A visible {count} is a bug someone reports; an empty string is a bug nobody sees.
    expect(interpolate("{count} words", {})).toBe("{count} words");
  });
});

describe("criterion labels", () => {
  it("translates the criterion but keeps the English exam term alongside", () => {
    // The learner will meet "Task Response" on a real feedback sheet, so hiding it
    // behind a translation would teach them vocabulary the exam does not use.
    const label = criterionLabel("TASK_RESPONSE", "vi");
    expect(label).toContain("Task Response");
    expect(label).not.toBe(criterionLabel("TASK_RESPONSE", "en"));
  });

  it("uses the plain English term in English", () => {
    expect(criterionLabel("GRAMMATICAL_RANGE", "en")).toBe(
      "Grammatical Range & Accuracy",
    );
  });
});

describe("translate", () => {
  it("returns the requested locale's string", () => {
    expect(translate("en", "nav.grader")).toBe("Grade Writing");
    expect(translate("vi", "nav.grader")).toBe("Chấm bài viết");
  });
});
