import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import AssessmentResult from "@/components/workspace/AssessmentResult";
import type { AssessmentResult as Result } from "@/lib/apiClient";

/**
 * The fixture below is shaped EXACTLY like `001`'s `AssessmentResultResponse` — verified
 * against `backend/src/schemas/assessment.py`, not invented from the mockup. That
 * distinction is the point of this file: the `learner_workspace` design shows per-
 * sentence corrections with Grammar/Vocabulary chips, and `001` returns nothing of the
 * kind. It returns four criterion objects, each with a band, a prose explanation, and
 * verbatim evidence quotes.
 *
 * So these tests assert the component renders what the API actually sends, and — just
 * as importantly — that it does not invent the parts the API does not send.
 */
const RESULT: Result = {
  submission_id: "0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0",
  overall_band: 6.5,
  criteria: [
    {
      criterion: "TASK_RESPONSE",
      band: 6.0,
      explanation: "The position is clear but the second body paragraph drifts off task.",
      evidence_quotes: ["Some people believe that technology is harmful."],
      descriptor_reference: "Band 6: addresses all parts of the task",
    },
    {
      criterion: "COHERENCE_COHESION",
      band: 7.0,
      explanation: "Paragraphing is logical and cohesive devices are used accurately.",
      evidence_quotes: ["Furthermore, the evidence suggests otherwise."],
      descriptor_reference: null,
    },
    {
      criterion: "LEXICAL_RESOURCE",
      band: 6.5,
      explanation: "Adequate range with occasional imprecision in collocation.",
      evidence_quotes: ["make a big influence on society"],
      descriptor_reference: null,
    },
    {
      criterion: "GRAMMATICAL_RANGE_ACCURACY",
      band: 6.5,
      explanation: "A mix of simple and complex forms; article errors recur.",
      evidence_quotes: [],
      descriptor_reference: null,
    },
  ],
  created_at: "2026-08-20T10:00:00Z",
};

describe("AssessmentResult — overall band", () => {
  it("shows the overall band prominently (FR-005)", () => {
    render(<AssessmentResult result={RESULT} />);
    expect(screen.getByTestId("overall-band")).toHaveTextContent("6.5");
  });

  it("labels the overall band so the number is not orphaned", () => {
    render(<AssessmentResult result={RESULT} />);
    expect(screen.getByText(/overall band/i)).toBeInTheDocument();
  });
});

describe("AssessmentResult — criteria grid", () => {
  it("renders one card per criterion returned, using human labels not enum codes", () => {
    render(<AssessmentResult result={RESULT} />);
    expect(screen.getAllByTestId("criterion-card")).toHaveLength(4);
    expect(screen.getByText("Task Response")).toBeInTheDocument();
    expect(screen.getByText("Coherence and Cohesion")).toBeInTheDocument();
    expect(screen.queryByText("TASK_RESPONSE")).not.toBeInTheDocument();
  });

  it("renders whichever four criteria the API sent, not a hardcoded Task 2 set", () => {
    // Task 1 sends TASK_ACHIEVEMENT where Task 2 sends TASK_RESPONSE. Hardcoding the
    // Task 2 names would silently mislabel every Task 1 result.
    const task1: Result = {
      ...RESULT,
      criteria: [
        { ...RESULT.criteria[0], criterion: "TASK_ACHIEVEMENT" },
        ...RESULT.criteria.slice(1),
      ],
    };
    render(<AssessmentResult result={task1} />);
    expect(screen.getByText("Task Achievement")).toBeInTheDocument();
    expect(screen.queryByText("Task Response")).not.toBeInTheDocument();
  });

  it("gives each criterion a proportion indicator scaled against the band-9 maximum", () => {
    render(<AssessmentResult result={RESULT} />);
    const bars = screen.getAllByRole("meter");
    expect(bars).toHaveLength(4);
    // A band of 6.0 on the IELTS 1–9 scale, exposed to assistive tech as real values
    // rather than a decorative div whose width only sighted users can read.
    expect(bars[0]).toHaveAttribute("aria-valuenow", "6");
    expect(bars[0]).toHaveAttribute("aria-valuemax", "9");
  });
});

describe("AssessmentResult — expandable per-criterion detail", () => {
  it("keeps detail collapsed until the learner opens it", () => {
    render(<AssessmentResult result={RESULT} />);
    expect(
      screen.queryByText(/the position is clear but the second body paragraph/i),
    ).not.toBeInTheDocument();
  });

  it("reveals the explanation and evidence quotes on expand", async () => {
    const user = userEvent.setup();
    render(<AssessmentResult result={RESULT} />);

    await user.click(screen.getByRole("button", { name: /task response/i }));

    expect(screen.getByText(RESULT.criteria[0].explanation)).toBeInTheDocument();
    expect(
      screen.getByText(`“${RESULT.criteria[0].evidence_quotes[0]}”`),
    ).toBeInTheDocument();
  });

  it("shows the descriptor reference when the API supplied one", () => {
    render(<AssessmentResult result={RESULT} defaultOpen="TASK_RESPONSE" />);
    expect(screen.getByText(/band 6: addresses all parts/i)).toBeInTheDocument();
  });

  it("handles a criterion with no evidence quotes without rendering an empty quote block", () => {
    // `evidence_quotes` is optional in 001's schema and genuinely comes back empty when
    // server-side verification rejects every quote the model produced.
    render(<AssessmentResult result={RESULT} defaultOpen="GRAMMATICAL_RANGE_ACCURACY" />);
    expect(screen.getByText(RESULT.criteria[3].explanation)).toBeInTheDocument();
    expect(screen.queryByTestId("evidence-list")).not.toBeInTheDocument();
  });
});

describe("AssessmentResult — does not invent data 001 never sends", () => {
  it("shows no per-sentence 'suggested correction' anywhere", () => {
    // The mockup promises one; 001's contract has no field for it. Rendering an
    // invented correction would fabricate teaching advice from a model that was never
    // asked for it — the exact failure 001's evidence-anchoring guards against.
    render(<AssessmentResult result={RESULT} defaultOpen="TASK_RESPONSE" />);
    expect(screen.queryByText(/suggested correction/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/rewrite/i)).not.toBeInTheDocument();
  });

  it("does not display a raw submission id as if it were learner-facing content", () => {
    render(<AssessmentResult result={RESULT} />);
    expect(screen.queryByText(RESULT.submission_id)).not.toBeInTheDocument();
  });
});

describe("AssessmentResult — resilience to real API variation", () => {
  it("renders a band of 9 without overflowing the proportion indicator", () => {
    const perfect: Result = {
      ...RESULT,
      overall_band: 9,
      criteria: RESULT.criteria.map((c) => ({ ...c, band: 9 })),
    };
    render(<AssessmentResult result={perfect} />);
    for (const meter of screen.getAllByRole("meter")) {
      expect(meter).toHaveAttribute("aria-valuenow", "9");
    }
  });

  it("renders whole-number bands without a misleading trailing decimal", () => {
    const whole: Result = { ...RESULT, overall_band: 7 };
    render(<AssessmentResult result={whole} />);
    // IELTS reports 7.0, not 7 — the .0 is meaningful in this domain.
    expect(screen.getByTestId("overall-band")).toHaveTextContent("7.0");
  });

  it("does not crash when the API returns fewer than four criteria", () => {
    const partial: Result = { ...RESULT, criteria: RESULT.criteria.slice(0, 2) };
    render(<AssessmentResult result={partial} />);
    expect(screen.getAllByTestId("criterion-card")).toHaveLength(2);
  });
});

describe("AssessmentResult — accessibility of the expand control", () => {
  it("exposes expanded state to assistive technology", async () => {
    const user = userEvent.setup();
    render(<AssessmentResult result={RESULT} />);
    const trigger = screen.getByRole("button", { name: /lexical resource/i });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("allows more than one criterion open at once", async () => {
    // Unlike the FAQ (FR-016), nothing here asks for single-open — and forcing it would
    // stop a learner comparing two criteria side by side, which is the main reason to
    // open them at all.
    const user = userEvent.setup();
    render(<AssessmentResult result={RESULT} />);

    await user.click(screen.getByRole("button", { name: /task response/i }));
    await user.click(screen.getByRole("button", { name: /coherence and cohesion/i }));

    expect(screen.getByText(RESULT.criteria[0].explanation)).toBeInTheDocument();
    expect(screen.getByText(RESULT.criteria[1].explanation)).toBeInTheDocument();
  });
});

describe("AssessmentResult — evidence quotes are the learner's own words", () => {
  it("marks quotes up as quotations rather than plain prose", () => {
    render(<AssessmentResult result={RESULT} defaultOpen="LEXICAL_RESOURCE" />);
    const list = screen.getByTestId("evidence-list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    expect(list.querySelector("blockquote")).not.toBeNull();
  });
});
