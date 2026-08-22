/**
 * Fixture text that exists in both interface languages.
 *
 * Feedback is the one kind of "data" a learner reads as prose, so a Vietnamese learner
 * would hit an English wall the moment they received a score if fixtures were English
 * only. The data client takes a locale and resolves these before returning — which is
 * also how a real service would do it, from an `Accept-Language` header.
 *
 * What is NOT localised, anywhere in these fixtures: exam prompts, chart stimuli, and
 * practice model answers. Those are the material being practised. Translating them would
 * quietly change the exercise.
 */

export interface LocalizedText {
  en: string;
  vi: string;
}

export type Locale = "en" | "vi";

export function text(value: LocalizedText, locale: Locale): string {
  return value[locale] ?? value.en;
}

export function textList(values: LocalizedText[], locale: Locale): string[] {
  return values.map((value) => text(value, locale));
}
