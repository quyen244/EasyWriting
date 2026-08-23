// Quote-fidelity verification. Ported from eval/src/pipeline/verify.py.
//
// Every claim the model makes about the essay must be anchored to text that actually
// exists in it. Matching is exact substring after normalisation — deliberately NOT
// fuzzy. Fuzzy matching would paper over fabrication; exact matching yields an honest
// quote-fidelity number, which is what makes the credibility claim testable rather
// than aspirational.
//
// This is the load-bearing half of a three-part defence: the prompt asks for verbatim
// quotes, the schema makes evidence required, and this drops what the essay does not
// contain. Only this part is enforcement; the other two just reduce how often it has
// to intervene.
//
// A criterion whose quotes were ALL fabricated still keeps its band and explanation —
// the band came from the rubric-grounded justification, not the quotes — but it is
// persisted with an empty evidence list rather than a fictional one.

const SMART_QUOTES: Record<string, string> = {
  "‘": "'",
  "’": "'",
  "“": '"',
  "”": '"',
  "–": "-",
  "—": "-",
  "…": "...",
  " ": " ",
};

// A one- to three-character "quote" would match almost any essay trivially and tells
// us nothing about whether the model actually read the text.
export const MIN_QUOTE_LENGTH = 4;

export function normalize(text: string): string {
  let out = "";
  for (const ch of text) out += SMART_QUOTES[ch] ?? ch;
  return out.toLowerCase().replace(/\s+/g, " ").trim();
}

export function quoteInEssay(quote: string, essayNormalized: string): boolean {
  const q = normalize(quote);
  if (q.length < MIN_QUOTE_LENGTH) return false;
  return essayNormalized.includes(q);
}

export interface VerifiedQuotes<T> {
  kept: T[];
  dropped: number;
}

// Generic over the evidence item so the caller keeps each quote's commentary attached;
// the harness only needed the strings, but a stored result shows both.
export function dropUnverifiedQuotes<T extends { quote: string }>(
  evidence: T[],
  essayText: string,
): VerifiedQuotes<T> {
  const essayNormalized = normalize(essayText);
  const kept = evidence.filter((e) => quoteInEssay(e.quote, essayNormalized));
  return { kept, dropped: evidence.length - kept.length };
}
