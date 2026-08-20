/**
 * FAQ content (002 T039, FR-013 / FR-015).
 *
 * Static, in-code content by design (research.md decision 4) — a CMS for a dozen entries
 * would violate Principle VI.
 *
 * ── Three answers deliberately contradict the mockup ────────────────────────────────
 *
 * The `frequently_asked_questions` design was written before the backend existed and
 * describes a product that does not match what `001`/`003` actually shipped. Copying it
 * verbatim would publish three false statements to real visitors:
 *
 *   1. "Can I sign in with Google? — Yes, WriteWise supports SSO."
 *      `003` is email + password only; OAuth is explicitly deferred. The spec's own
 *      Assumptions flag this conflict, and `/speckit-analyze` finding I3 called it out.
 *      Replaced with an honest "not yet".
 *
 *   2. "I forgot my password — click Forgot Password."
 *      There is no password-reset endpoint. Checked against the live OpenAPI document:
 *      `/api/v1/auth/{signup,signin,signout,refresh,me}` and nothing else. Pointing a
 *      locked-out learner at a link that does not exist is worse than saying so.
 *
 *   3. Generic "academic writing / research papers" framing.
 *      The product scores IELTS Writing Task 1 and Task 2 against four published
 *      criteria. Rewritten to describe that.
 *
 * The "is the score official" answer (FR-015) is the one place where the mockup's
 * wording was already right, and it is kept firm.
 */

export type FaqCategory = "Getting Started" | "Account & Login" | "Essay Scoring";

export const FAQ_CATEGORIES: FaqCategory[] = [
  "Getting Started",
  "Account & Login",
  "Essay Scoring",
];

export interface FaqEntry {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    id: "what-is-writewise",
    category: "Getting Started",
    question: "What is WriteWise?",
    answer:
      "WriteWise scores IELTS Writing essays against the four published assessment criteria and explains each band, quoting the sentences in your essay that the judgement was based on. It is a practice tool, not a marking service.",
  },
  {
    id: "who-is-it-for",
    category: "Getting Started",
    question: "Who is it for?",
    answer:
      "Candidates preparing for IELTS Academic or General Training Writing who want to know why an essay scored what it did, quickly enough to act on it before writing the next one.",
  },
  {
    id: "first-essay",
    category: "Getting Started",
    question: "How do I submit my first essay?",
    answer:
      "Create an account, open the workspace, choose Task 1 or Task 2, paste your essay, and select “Score my essay”. Results usually arrive in a few seconds.",
  },
  {
    id: "task-types",
    category: "Getting Started",
    question: "Which task types are supported?",
    answer:
      "Both. Task 1 needs at least 150 words and is scored on Task Achievement; Task 2 needs at least 250 and is scored on Task Response. The other three criteria are the same for both.",
  },
  {
    id: "google-sign-in",
    category: "Account & Login",
    question: "Can I sign in with Google?",
    answer:
      "Not yet. Accounts are email and password only for now. Single sign-on is on the roadmap but is not available today.",
  },
  {
    id: "forgot-password",
    category: "Account & Login",
    question: "I forgot my password. What now?",
    answer:
      "Self-service password reset is not built yet, so there is no reset link on the sign-in page. Contact support and we will help you regain access.",
  },
  {
    id: "delete-account",
    category: "Account & Login",
    question: "Can I delete my account?",
    answer:
      "Not from the profile page yet — it is view-only for now. Contact support and we will remove your account and its submissions.",
  },
  {
    id: "how-scoring-works",
    category: "Essay Scoring",
    question: "How does WriteWise score my essay?",
    answer:
      "Each of the four criteria is assessed separately against the published band descriptors, and the results are combined into an overall band. Every criterion comes back with a written justification and quotes taken verbatim from your essay.",
  },
  {
    id: "is-the-score-official",
    category: "Essay Scoring",
    question: "Is the score official?",
    answer:
      "No. The band score is an AI-generated estimate produced for practice and improvement only. It is not an official or certified IELTS result, it carries no standing with any test centre, university or immigration authority, and it must not be submitted anywhere as one.",
  },
  {
    id: "accuracy",
    category: "Essay Scoring",
    question: "How accurate is it?",
    answer:
      "Scoring is benchmarked against a set of essays with known bands, and that benchmark is re-run whenever the method changes. It is close enough to be useful for practice and not a substitute for an examiner.",
  },
  {
    id: "why-rejected",
    category: "Essay Scoring",
    question: "Why was my submission rejected without a score?",
    answer:
      "Either it was below the word minimum for the task, or there was not enough connected writing to assess. In both cases your text stays in the editor so you can extend it and submit again.",
  },
  {
    id: "line-by-line",
    category: "Essay Scoring",
    question: "Do I get sentence-by-sentence corrections?",
    answer:
      "Not yet. Today you get a band and a written justification per criterion, with supporting quotes from your essay. Sentence-level corrections and rewrite suggestions are planned but are not part of the product today.",
  },
];
