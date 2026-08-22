import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MockTestWritingPage from "@/app/mock-test/writing/page";
import { getHistory, resetStore } from "@/lib/api";

import { render, screen, waitFor, within } from "../support/render";

/**
 * The Writing mock test.
 *
 * The assertions worth having here are the exam ones: an answer survives a task switch,
 * the clock runs, and submitting is deliberate rather than one misclick away.
 */

const router = { push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/mock-test/writing",
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    status: "authenticated",
    account: { id: "acc_1", email: "learner@writewise.app", display_name: "Learner" },
    accessToken: "token",
    signOut: vi.fn(),
  }),
}));

const ANSWER_ONE = "The line graph compares four ways of commuting over twenty years.";
const ANSWER_TWO = "Congestion has worsened because car ownership outpaced road capacity.";

beforeEach(() => {
  vi.clearAllMocks();
  resetStore();
});

async function startTest(user: ReturnType<typeof userEvent.setup>) {
  render(<MockTestWritingPage />);
  await user.click(await screen.findByRole("button", { name: /start the test/i }));
}

async function fill(
  user: ReturnType<typeof userEvent.setup>,
  field: HTMLElement,
  value: string,
) {
  await user.click(field);
  await user.paste(value);
}

describe("Mock test — Writing", () => {
  it("briefs the candidate before the clock starts", async () => {
    render(<MockTestWritingPage />);

    expect(await screen.findByText(/before you start/i)).toBeInTheDocument();
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  });

  it("starts the clock only once the candidate is ready", async () => {
    const user = userEvent.setup();
    await startTest(user);

    expect(screen.getByRole("timer")).toHaveTextContent("60:00");
  });

  it("keeps both answers when the candidate switches tasks", async () => {
    const user = userEvent.setup();
    await startTest(user);

    await fill(user, screen.getByLabelText(/your answer/i), ANSWER_ONE);
    await user.click(screen.getByRole("tab", { name: /task 2/i }));
    await fill(user, screen.getByLabelText(/your answer/i), ANSWER_TWO);

    expect(screen.getByLabelText(/your answer/i)).toHaveValue(ANSWER_TWO);

    await user.click(screen.getByRole("tab", { name: /task 1/i }));
    expect(screen.getByLabelText(/your answer/i)).toHaveValue(ANSWER_ONE);
  });

  it("counts each task's words against its own minimum", async () => {
    const user = userEvent.setup();
    await startTest(user);

    expect(screen.getByTestId("word-count")).toHaveTextContent("0 / 150 words");

    await user.click(screen.getByRole("tab", { name: /task 2/i }));
    expect(screen.getByTestId("word-count")).toHaveTextContent("0 / 250 words");
  });

  it("shows the Task 1 data beside the answer area", async () => {
    const user = userEvent.setup();
    await startTest(user);

    const stimulus = screen.getByText(/the data/i).closest("div")!;
    expect(within(stimulus).getByText(/public transport/i)).toBeInTheDocument();
  });

  it("asks before submitting, and warns about unfinished tasks", async () => {
    // Submitting is irreversible and a misclick on a 40-minute essay is not a
    // recoverable mistake.
    const user = userEvent.setup();
    await startTest(user);

    await user.click(screen.getByRole("button", { name: /submit test/i }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/cannot return to your answers/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/under (its|their) word minimum/i)).toBeInTheDocument();
  });

  it("can be backed out of without submitting", async () => {
    const user = userEvent.setup();
    await startTest(user);

    await user.click(screen.getByRole("button", { name: /submit test/i }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("timer")).toBeInTheDocument();
  });

  it("marks both tasks and reports a combined band", async () => {
    const user = userEvent.setup();
    await startTest(user);

    await fill(user, screen.getByLabelText(/your answer/i), ANSWER_ONE);
    await user.click(screen.getByRole("tab", { name: /task 2/i }));
    await fill(user, screen.getByLabelText(/your answer/i), ANSWER_TWO);

    await user.click(screen.getByRole("button", { name: /submit test/i }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: /submit test/i }),
    );

    expect(await screen.findByText(/overall writing band/i)).toBeInTheDocument();
    // One full result per task, rendered by the same dashboard the grader uses.
    await waitFor(() => expect(screen.getAllByTestId("overall-band")).toHaveLength(2));
  });

  it("records the attempt in the learner's history", async () => {
    const user = userEvent.setup();
    const before = await getHistory();
    await startTest(user);

    await fill(user, screen.getByLabelText(/your answer/i), ANSWER_ONE);
    await user.click(screen.getByRole("button", { name: /submit test/i }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: /submit test/i }),
    );
    await screen.findByText(/overall writing band/i);

    const after = await getHistory();
    expect(after).toHaveLength(before.length + 2);
    expect(after[0].source).toBe("mock_test");
  });
});
