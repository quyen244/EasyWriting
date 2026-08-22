/**
 * Canonical criterion labels.
 *
 * The wire carries a `label` on every criterion, and the UI ignores it in favour of
 * this. That is deliberate: a label is interface text, it has to exist in both locales,
 * and a service that returned "Task Response" to a Vietnamese learner would be deciding
 * something it has no business deciding.
 */

import { translate, type Locale, type MessageKey } from "@/lib/i18n";

import type { CriterionCode } from "./types";

const MESSAGE_KEY: Record<CriterionCode, MessageKey> = {
  TASK_ACHIEVEMENT: "criterion.TASK_ACHIEVEMENT",
  TASK_RESPONSE: "criterion.TASK_RESPONSE",
  COHERENCE_COHESION: "criterion.COHERENCE_COHESION",
  LEXICAL_RESOURCE: "criterion.LEXICAL_RESOURCE",
  GRAMMATICAL_RANGE: "criterion.GRAMMATICAL_RANGE",
};

export function criterionLabel(code: CriterionCode, locale: Locale): string {
  return translate(locale, MESSAGE_KEY[code]);
}

export function criterionLabels(locale: Locale): Record<CriterionCode, string> {
  return {
    TASK_ACHIEVEMENT: criterionLabel("TASK_ACHIEVEMENT", locale),
    TASK_RESPONSE: criterionLabel("TASK_RESPONSE", locale),
    COHERENCE_COHESION: criterionLabel("COHERENCE_COHESION", locale),
    LEXICAL_RESOURCE: criterionLabel("LEXICAL_RESOURCE", locale),
    GRAMMATICAL_RANGE: criterionLabel("GRAMMATICAL_RANGE", locale),
  };
}

/**
 * Accepts the older `GRAMMATICAL_RANGE_ACCURACY` spelling.
 *
 * The existing assessments client uses it; the wire shape this product is built against
 * uses `GRAMMATICAL_RANGE`. Normalising at the boundary means exactly one spelling ever
 * reaches a component, and nothing above has to know there were two.
 */
export function normaliseCriterionCode(code: string): CriterionCode {
  if (code === "GRAMMATICAL_RANGE_ACCURACY") return "GRAMMATICAL_RANGE";
  return code as CriterionCode;
}
