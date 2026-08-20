import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WorkspacePage from "@/app/workspace/page";
import { AssessmentApiError, type AssessmentResult as Result } from "@/lib/apiClient";

const router = { replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    status: "authenticated",
    account: { id: "1", email: "learner@example.com", display_name: "Mai" },
    accessToken: "token-123",
  }),
}));

const createAssessment = vi.fn();
vi.mock("@/lib/apiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/apiClient")>();
  return { ...actual, createAssessment: (...args: unknown[]) => createAssessment(...args) };
});

const RESULT: Result = {
  submission_id: "abc",
  overall_band: 7.0,
  criteria: [
    {
      criterion: "TASK_RESPONSE",
      band: 7,
      explanation: "Clear position throughout.",
      evidence_quotes: ["I firmly believe this is the case."],
      descriptor_reference: null,
    },
  ],
  created_at: "2026-08-20T10:00:00Z",
};

const ESSAY = "This is my essay about technology and its role in modern education.";

async function typeEssayAndSubmit() {
  const user = userEvent.setup();
  render(<WorkspacePage />);
  await user.type(screen.getByLabelText(/your essay/i), ESSAY);
  await user.click(screen.getByRole("button", { name: /score my essay/i }));
  return user;
}

beforeEach(() => {
  createAssessment.mockReset();
});

describe("Workspace view state", () => {
  it("starts in the empty state (FR-007)", () => {
    render(<WorkspacePage />);
    expect(screen.getByText(/no score yet/i)).toBeInTheDocument();
  });

  it("shows an in-progress indication while scoring runs (FR-006)", async () => {
    let resolve: (r: Result) => void = () => {};
    createAssessment.mockReturnValue(new Promise<Result>((r) => (resolve = r)));

    await typeEssayAndSubmit();

    expect(await screen.findByText(/scoring against all four criteria/i)).toBeInTheDocument();
    resolve(RESULT);
    await waitFor(() => expect(screen.getByTestId("overall-band")).toBeInTheDocument());
  });

  it("renders the result in the same view, with no navigation (FR-005)", async () => {
    createAssessment.mockResolvedValue(RESULT);
    await typeEssayAndSubmit();

    expect(await screen.findByTestId("overall-band")).toHaveTextContent("7.0");
    expect(router.push).not.toHaveBeenCalled();
    // The editor is still on screen — the result did not replace it.
    expect(screen.getByLabelText(/your essay/i)).toBeInTheDocument();
  });

  it("sends the selected task type and the typed essay to 001", async () => {
    createAssessment.mockResolvedValue(RESULT);
    await typeEssayAndSubmit();

    await waitFor(() => expect(createAssessment).toHaveBeenCalled());
    const [payload, token] = createAssessment.mock.calls[0];
    expect(payload).toMatchObject({ task_type: "TASK_2", essay_text: ESSAY });
    expect(token).toBe("token-123");
  });

  it("sends prompt_text as null rather than an empty string when unused", async () => {
    // `001`'s schema types it as `string | null`; an empty string is a different value
    // and would be scored as a prompt the learner never wrote.
    createAssessment.mockResolvedValue(RESULT);
    await typeEssayAndSubmit();

    await waitFor(() => expect(createAssessment).toHaveBeenCalled());
    expect(createAssessment.mock.calls[0][0].prompt_text).toBeNull();
  });
});

describe("Workspace error handling (FR-009)", () => {
  it("keeps the essay text in the editor after a rejection", async () => {
    createAssessment.mockRejectedValue(
      new AssessmentApiError("BELOW_MIN_WORDS", "Too short.", 400, 250),
    );
    await typeEssayAndSubmit();

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    // The requirement, stated directly: nothing the learner typed was lost.
    expect(screen.getByLabelText(/your essay/i)).toHaveValue(ESSAY);
  });

  it("shows the exact minimum the server reported, not a hardcoded number", async () => {
    createAssessment.mockRejectedValue(
      new AssessmentApiError("BELOW_MIN_WORDS", "Too short.", 400, 150),
    );
    await typeEssayAndSubmit();

    expect(await screen.findByText(/at least 150 words/i)).toBeInTheDocument();
  });

  it("distinguishes an unscoreable submission from a short one", async () => {
    createAssessment.mockRejectedValue(
      new AssessmentApiError("UNSCOREABLE", "Not an essay.", 400),
    );
    await typeEssayAndSubmit();

    expect(await screen.findByText(/does not look like an essay/i)).toBeInTheDocument();
    expect(screen.queryByText(/too short/i)).not.toBeInTheDocument();
  });

  it("offers retry only for a server-side failure, not for a learner-fixable one", async () => {
    createAssessment.mockRejectedValue(
      new AssessmentApiError("SCORING_FAILED", "Upstream unavailable.", 503),
    );
    await typeEssayAndSubmit();

    expect(await screen.findByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("does not offer retry for a below-minimum rejection", async () => {
    createAssessment.mockRejectedValue(
      new AssessmentApiError("BELOW_MIN_WORDS", "Too short.", 400, 250),
    );
    await typeEssayAndSubmit();

    await screen.findByRole("alert");
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });

  it("survives a network failure that is not an AssessmentApiError", async () => {
    createAssessment.mockRejectedValue(new TypeError("Failed to fetch"));
    await typeEssayAndSubmit();

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByLabelText(/your essay/i)).toHaveValue(ESSAY);
  });

  it("retrying after a failure re-submits the same preserved text", async () => {
    createAssessment.mockRejectedValueOnce(
      new AssessmentApiError("SCORING_FAILED", "Upstream unavailable.", 503),
    );
    const user = await typeEssayAndSubmit();

    await user.click(await screen.findByRole("button", { name: /try again/i }));

    await waitFor(() => expect(createAssessment).toHaveBeenCalledTimes(2));
    expect(createAssessment.mock.calls[1][0].essay_text).toBe(ESSAY);
  });
});
