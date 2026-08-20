import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import EssayForm from "@/components/workspace/EssayForm";

const TASK_2_MIN = 250;

function renderForm(overrides: Partial<React.ComponentProps<typeof EssayForm>> = {}) {
  const onSubmit = vi.fn();
  const props = {
    onSubmit,
    submitting: false,
    taskType: "TASK_2" as const,
    onTaskTypeChange: vi.fn(),
    essayText: "",
    onEssayTextChange: vi.fn(),
    promptText: "",
    onPromptTextChange: vi.fn(),
    ...overrides,
  };
  render(<EssayForm {...props} />);
  return props;
}

describe("EssayForm — task type", () => {
  it("offers both task types", () => {
    renderForm();
    expect(screen.getByRole("radio", { name: /task 1/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /task 2/i })).toBeInTheDocument();
  });

  it("reflects the selected task type", () => {
    renderForm({ taskType: "TASK_1" });
    expect(screen.getByRole("radio", { name: /task 1/i })).toBeChecked();
  });

  it("reports a task-type change to the parent", async () => {
    const user = userEvent.setup();
    const { onTaskTypeChange } = renderForm({ taskType: "TASK_2" });
    await user.click(screen.getByRole("radio", { name: /task 1/i }));
    expect(onTaskTypeChange).toHaveBeenCalledWith("TASK_1");
  });
});

describe("EssayForm — word count guidance", () => {
  it("shows the live word count against the minimum for the selected task", () => {
    renderForm({ essayText: "one two three" });
    expect(screen.getByTestId("word-count")).toHaveTextContent("3");
    expect(screen.getByTestId("word-count")).toHaveTextContent(String(TASK_2_MIN));
  });

  it("uses the Task 1 minimum when Task 1 is selected", () => {
    // 150 vs 250 — showing the wrong target would send a learner to a server-side
    // rejection they were told they had already cleared.
    renderForm({ taskType: "TASK_1", essayText: "word" });
    expect(screen.getByTestId("word-count")).toHaveTextContent("150");
  });

  it("warns while the essay is under the minimum", () => {
    renderForm({ essayText: "short essay" });
    expect(screen.getByTestId("word-count")).toHaveAttribute("data-below-minimum", "true");
  });

  it("stops warning once the minimum is reached", () => {
    renderForm({ essayText: Array.from({ length: TASK_2_MIN }, () => "word").join(" ") });
    expect(screen.getByTestId("word-count")).toHaveAttribute("data-below-minimum", "false");
  });
});

describe("EssayForm — submission", () => {
  it("submits the essay", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      essayText: Array.from({ length: TASK_2_MIN }, () => "word").join(" "),
    });
    await user.click(screen.getByRole("button", { name: /score my essay/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("disables submission while a request is in flight (FR-006)", () => {
    renderForm({ submitting: true });
    expect(screen.getByRole("button", { name: /scoring/i })).toBeDisabled();
  });

  it("disables submission for an empty essay", () => {
    renderForm({ essayText: "   " });
    expect(screen.getByRole("button", { name: /score my essay/i })).toBeDisabled();
  });

  it("still allows submitting an under-length essay", async () => {
    // The client count is a hint; `001`'s server-side count is authoritative and its
    // rejection carries the real minimum. Blocking here would let a client/server
    // counting disagreement silently prevent a valid submission.
    const user = userEvent.setup();
    const { onSubmit } = renderForm({ essayText: "only a few words here" });
    await user.click(screen.getByRole("button", { name: /score my essay/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});

describe("EssayForm — text preservation (FR-009)", () => {
  it("renders the essay text it is given, so a parent can preserve it across an error", () => {
    renderForm({ essayText: "my carefully typed essay" });
    expect(screen.getByLabelText(/your essay/i)).toHaveValue("my carefully typed essay");
  });

  it("never clears the text itself — it is a controlled input", async () => {
    const user = userEvent.setup();
    const { onEssayTextChange } = renderForm({ essayText: "draft" });
    await user.type(screen.getByLabelText(/your essay/i), "!");
    expect(onEssayTextChange).toHaveBeenCalled();
  });
});

describe("EssayForm — accessibility", () => {
  it("labels every input", () => {
    renderForm();
    expect(screen.getByLabelText(/your essay/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/question|prompt/i)).toBeInTheDocument();
  });

  it("groups the task-type radios under a legend", () => {
    renderForm();
    expect(screen.getByRole("group", { name: /task type/i })).toBeInTheDocument();
  });
});
