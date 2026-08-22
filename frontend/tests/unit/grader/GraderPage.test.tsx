import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WorkspacePage from "@/app/workspace/page";
import { resetStore } from "@/lib/api";

import { render, screen, waitFor, within } from "../support/render";

/**
 * The grader page, driven end to end against the real data client in mock mode.
 *
 * Nothing is stubbed below the page except auth and the router, because the point of
 * putting mock mode inside the client was that a page test could exercise the whole
 * path — toggle, editor, grading, result — without inventing a fake API to talk to.
 */

const push = vi.fn();
const router = { push, replace: vi.fn(), prefetch: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/workspace",
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    status: "authenticated",
    account: { id: "acc_1", email: "learner@writewise.app", display_name: "Learner" },
    accessToken: "token",
    signOut: vi.fn(),
  }),
}));

const TASK_2_ESSAY = `
Remote work is often presented as a benefit to staff and employers alike, although critics
counter that it erodes the informal collaboration on which teams depend. In my view the
balance turns almost entirely on management practice rather than on location. Employees
recover a great deal of time, because a typical urban commute consumes close to ten hours
each week, and that time is generally spent on rest rather than on further work.
`.trim();

beforeEach(() => {
  vi.clearAllMocks();
  resetStore();
});

/**
 * Fill a textarea in one event.
 *
 * `user.type` dispatches a keystroke per character and re-renders the whole page each
 * time, which on a 350-character essay costs seconds per test for no added realism —
 * learners paste their essays in anyway.
 */
async function fill(
  user: ReturnType<typeof userEvent.setup>,
  field: HTMLElement,
  value: string,
) {
  await user.click(field);
  await user.paste(value);
}

describe("Grader page", () => {
  it("starts on Task 2 with the 250-word minimum", () => {
    render(<WorkspacePage />);
    expect(screen.getByTestId("word-count")).toHaveTextContent("0 / 250 words");
  });

  it("reshapes the editor for Task 1, with the three scored parts", async () => {
    const user = userEvent.setup();
    render(<WorkspacePage />);

    await user.click(screen.getByRole("radio", { name: /task 1/i }));

    expect(screen.getByLabelText(/introduction/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/overview/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/body/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/your essay/i)).not.toBeInTheDocument();
    expect(screen.getAllByTestId("word-count")[0]).toHaveTextContent("/ 150 words");
  });

  it("keeps each task's draft when the learner toggles between them", async () => {
    // A learner toggles to check the other task's requirements constantly. Losing an
    // essay to that would be unforgivable in a writing product.
    const user = userEvent.setup();
    render(<WorkspacePage />);

    await user.type(screen.getByLabelText(/your essay/i), "Task two draft.");
    await user.click(screen.getByRole("radio", { name: /task 1/i }));
    await user.type(screen.getByLabelText(/introduction/i), "Task one introduction.");
    await user.click(screen.getByRole("radio", { name: /task 2/i }));

    expect(screen.getByLabelText(/your essay/i)).toHaveValue("Task two draft.");

    await user.click(screen.getByRole("radio", { name: /task 1/i }));
    expect(screen.getByLabelText(/introduction/i)).toHaveValue("Task one introduction.");
  });

  it("totals the three Task 1 parts into one word count", async () => {
    const user = userEvent.setup();
    render(<WorkspacePage />);

    await user.click(screen.getByRole("radio", { name: /task 1/i }));
    await user.type(screen.getByLabelText(/introduction/i), "one two three");
    await user.type(screen.getByLabelText(/overview/i), "four five");

    expect(screen.getAllByTestId("word-count")[0]).toHaveTextContent("5 / 150 words");
  });

  it("shows a scoring state and then the result, without leaving the page", async () => {
    const user = userEvent.setup();
    render(<WorkspacePage />);

    await fill(user, screen.getByLabelText(/your essay/i), TASK_2_ESSAY);
    await user.click(screen.getByRole("button", { name: /grade now/i }));

    expect(await screen.findByTestId("overall-band")).toBeInTheDocument();
    expect(screen.getAllByTestId("criterion-card")).toHaveLength(4);
    expect(push).not.toHaveBeenCalled();
  });

  it("scores Task 1 on Task Achievement, never Task Response", async () => {
    const user = userEvent.setup();
    render(<WorkspacePage />);

    await user.click(screen.getByRole("radio", { name: /task 1/i }));
    await fill(user, screen.getByLabelText(/body/i), TASK_2_ESSAY);
    await user.click(screen.getByRole("button", { name: /grade now/i }));

    await screen.findByTestId("overall-band");
    const criteria = screen.getByRole("region", { name: /^result$/i });
    expect(within(criteria).getAllByText(/task achievement/i).length).toBeGreaterThan(0);
    expect(within(criteria).queryByText(/task response/i)).not.toBeInTheDocument();
  });

  it("returns to the editor with the essay intact from the result", async () => {
    const user = userEvent.setup();
    render(<WorkspacePage />);

    await fill(user, screen.getByLabelText(/your essay/i), TASK_2_ESSAY);
    await user.click(screen.getByRole("button", { name: /grade now/i }));
    await screen.findByTestId("overall-band");

    await user.click(screen.getByRole("button", { name: /improve essay/i }));
    expect(screen.getByLabelText(/your essay/i)).toHaveValue(TASK_2_ESSAY);
  });

  it("sends the learner to a practice module for their weakest criterion", async () => {
    const user = userEvent.setup();
    render(<WorkspacePage />);

    await fill(user, screen.getByLabelText(/your essay/i), TASK_2_ESSAY);
    await user.click(screen.getByRole("button", { name: /grade now/i }));
    await screen.findByTestId("overall-band");

    await user.click(screen.getByRole("button", { name: /practice weak area/i }));
    await waitFor(() => expect(push).toHaveBeenCalledOnce());
    expect(push.mock.calls[0][0]).toMatch(/^\/practice\/writing\/t2_/);
  });

  it("previews an uploaded chart and lets it be removed", async () => {
    const user = userEvent.setup();
    render(<WorkspacePage />);

    await user.click(screen.getByRole("radio", { name: /task 1/i }));
    const file = new File(["chart"], "electricity.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/upload image/i), file);

    const preview = await screen.findByRole("img", { name: /electricity\.png/i });
    expect(preview).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /remove image/i }));
    expect(screen.queryByRole("img", { name: /electricity\.png/i })).not.toBeInTheDocument();
  });

  it("accepts a typed chart description instead of an image", async () => {
    const user = userEvent.setup();
    render(<WorkspacePage />);

    await user.click(screen.getByRole("radio", { name: /task 1/i }));
    await fill(
      user,
      screen.getByLabelText(/describe the chart/i),
      "A bar chart comparing four countries.",
    );
    await fill(user, screen.getByLabelText(/body/i), TASK_2_ESSAY);
    await user.click(screen.getByRole("button", { name: /grade now/i }));

    expect(await screen.findByTestId("overall-band")).toBeInTheDocument();
  });

  it("refuses to grade an empty editor", () => {
    render(<WorkspacePage />);
    expect(screen.getByRole("button", { name: /grade now/i })).toBeDisabled();
  });

  it("adapts the criteria panel to the selected task", async () => {
    const user = userEvent.setup();
    render(<WorkspacePage />);

    expect(screen.getByText(/scored on Task Response/i)).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /task 1/i }));
    expect(screen.getByText(/scored on Task Achievement/i)).toBeInTheDocument();
  });
});
