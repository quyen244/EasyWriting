import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import ResultDashboard from "@/components/result/ResultDashboard";
import type { GradingResult, TaskType } from "@/lib/api";

import { render, screen, within } from "../support/render";

/**
 * The result screen, asserted the way a learner reads it.
 *
 * Nothing here reaches for a class name or a component's state. What matters is that the
 * band is announced as a value, that Task 1 is never told it was scored on Task Response,
 * and that "strongest" and "weakest" agree with the four numbers printed beside them.
 */

function result(overrides: Partial<GradingResult> = {}, taskType: TaskType = "TASK_2"): GradingResult {
  const criteria =
    taskType === "TASK_1"
      ? ([
          ["TASK_ACHIEVEMENT", "Task Achievement", 6.5],
          ["COHERENCE_COHESION", "Coherence & Cohesion", 6.0],
          ["LEXICAL_RESOURCE", "Lexical Resource", 7.5],
          ["GRAMMATICAL_RANGE", "Grammatical Range & Accuracy", 5.5],
        ] as const)
      : ([
          ["TASK_RESPONSE", "Task Response", 6.5],
          ["COHERENCE_COHESION", "Coherence & Cohesion", 6.0],
          ["LEXICAL_RESOURCE", "Lexical Resource", 7.5],
          ["GRAMMATICAL_RANGE", "Grammatical Range & Accuracy", 5.5],
        ] as const);

  return {
    id: "sub_test",
    task_type: taskType,
    status: "scored",
    overall_band: 6.5,
    criteria: criteria.map(([code, label, band]) => ({
      code,
      label,
      band,
      comment: `Why ${label} scored ${band}.`,
      improvement: `Do this about ${label}.`,
      evidence_quotes: [`A sentence about ${label} from the essay.`],
    })),
    word_count: 243,
    min_words: 250,
    length_penalty: 0,
    provisional: false,
    pipeline_version: "pipeline-v1.0",
    model_id: "writewise/scoring-preview",
    created_at: "2026-08-20T10:00:00.000Z",
    scored_at: "2026-08-20T10:00:04.000Z",
    ...overrides,
  };
}

describe("ResultDashboard", () => {
  it("leads with the overall band, exposed as a value rather than a bar width", () => {
    render(<ResultDashboard result={result()} />);

    expect(screen.getByTestId("overall-band")).toHaveTextContent("6.5");
    const meter = screen.getByRole("meter", { name: /overall band/i });
    expect(meter).toHaveAttribute("aria-valuenow", "6.5");
    expect(meter).toHaveAttribute("aria-valuemax", "9");
  });

  it("names the strongest and weakest criterion, agreeing with the bands shown", () => {
    render(<ResultDashboard result={result()} />);

    // Scoped to the insight pair: "Needs improvement" also appears as the badge on the
    // weakest criterion's card, which is the same claim rather than a second one.
    const insights = screen.getByText(/strongest area/i).closest("dl")!;

    const strongest = within(insights).getByText(/strongest area/i).closest("div")!;
    expect(within(strongest).getByText(/lexical resource/i)).toBeInTheDocument();

    const weakest = within(insights).getByText(/needs improvement/i).closest("div")!;
    expect(within(weakest).getByText(/grammatical range/i)).toBeInTheDocument();
  });

  it("shows the weakest criterion's improvement as the key recommendation", () => {
    render(<ResultDashboard result={result()} />);

    const recommendation = screen.getByText(/key recommendation/i).closest("div")!;
    expect(
      within(recommendation).getByText("Do this about Grammatical Range & Accuracy."),
    ).toBeInTheDocument();
  });

  it("renders Task Achievement for Task 1 and never Task Response", () => {
    render(<ResultDashboard result={result({}, "TASK_1")} />);

    expect(screen.getAllByText(/task achievement/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/task response/i)).not.toBeInTheDocument();
  });

  it("states the shortfall against the word minimum", () => {
    render(<ResultDashboard result={result()} />);
    expect(screen.getByText(/7 words under the minimum/i)).toBeInTheDocument();
  });

  it("says the minimum was met when it was", () => {
    render(<ResultDashboard result={result({ word_count: 250 })} />);
    expect(screen.getByText(/minimum met/i)).toBeInTheDocument();
  });

  it("marks a provisional band only when the payload says so", () => {
    const { unmount } = render(<ResultDashboard result={result()} />);
    expect(screen.queryByText(/^provisional$/i)).not.toBeInTheDocument();
    unmount();

    render(<ResultDashboard result={result({ provisional: true })} />);
    expect(screen.getByText(/^provisional$/i)).toBeInTheDocument();
  });

  it("explains a length penalty rather than deducting silently", () => {
    render(<ResultDashboard result={result({ length_penalty: 0.5 })} />);
    expect(screen.getByText(/−0\.5 band/)).toBeInTheDocument();
    expect(screen.getByText(/costs you marks on the task criterion/i)).toBeInTheDocument();
  });

  it("opens the weakest criterion's detail by default, and leaves the others closed", () => {
    // The recommendation points at the weakest criterion, so making the learner hunt
    // for it undoes the work the insight block just did.
    render(<ResultDashboard result={result()} />);

    expect(screen.getByText("Why Grammatical Range & Accuracy scored 5.5.")).toBeVisible();
    expect(screen.queryByText("Why Lexical Resource scored 7.5.")).not.toBeInTheDocument();
  });

  it("lets two criteria be open at once, so they can be compared", async () => {
    const user = userEvent.setup();
    render(<ResultDashboard result={result()} />);

    await user.click(screen.getByRole("button", { name: /lexical resource/i }));

    expect(screen.getByText("Why Lexical Resource scored 7.5.")).toBeVisible();
    expect(screen.getByText("Why Grammatical Range & Accuracy scored 5.5.")).toBeVisible();
  });

  it("quotes the essay under the criterion it is evidence for", async () => {
    const user = userEvent.setup();
    render(<ResultDashboard result={result()} />);

    await user.click(screen.getByRole("button", { name: /task response/i }));
    const quotes = screen.getAllByTestId("evidence-list");
    expect(quotes.length).toBeGreaterThan(0);
    expect(
      screen.getByText(/A sentence about Task Response from the essay\./),
    ).toBeInTheDocument();
  });

  it("keeps scoring metadata available but closed", () => {
    render(<ResultDashboard result={result()} />);

    const details = screen.getByText(/scoring details/i).closest("details")!;
    expect(details).not.toHaveAttribute("open");
    expect(within(details).getByText("pipeline-v1.0")).toBeInTheDocument();
  });

  it("renders result actions when the page supplies them", () => {
    render(
      <ResultDashboard result={result()} actions={<button type="button">Try again</button>} />,
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
