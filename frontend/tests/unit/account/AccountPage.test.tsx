import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AccountPage from "@/app/account/page";
import { getProgress, resetStore } from "@/lib/api";

import { render, screen, within } from "../support/render";

/**
 * The account area.
 *
 * The assertion that matters most is agreement: the averages on the progress tab are
 * derived from the same submissions the history tab lists, so a learner can never be
 * shown a number that contradicts the essays printed beside it.
 */

const router = { push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/account",
  useSearchParams: () => new URLSearchParams(),
}));

const signOut = vi.fn().mockResolvedValue(undefined);
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    status: "authenticated",
    account: { id: "acc_1", email: "learner@writewise.app", display_name: "Minh Anh" },
    accessToken: "token",
    signOut,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  resetStore();
});

describe("Account", () => {
  it("opens on progress, with the headline averages", async () => {
    render(<AccountPage />);

    expect(await screen.findByText(/overall average band/i)).toBeInTheDocument();
    expect(screen.getByText(/task 1 average/i)).toBeInTheDocument();
    expect(screen.getByText(/task 2 average/i)).toBeInTheDocument();
  });

  it("shows the same overall average the data client derives", async () => {
    const progress = await getProgress();
    render(<AccountPage />);

    const tile = (await screen.findByText(/overall average band/i)).closest("div")!;
    expect(within(tile).getByText(progress.overall_average!.toFixed(1))).toBeInTheDocument();
  });

  it("names the strongest and weakest criterion", async () => {
    render(<AccountPage />);

    const strongest = (await screen.findByText(/strongest criterion/i)).closest("div")!;
    expect(within(strongest).getByText(/lexical resource/i)).toBeInTheDocument();

    const weakest = screen.getByText(/weakest criterion/i).closest("div")!;
    expect(within(weakest).getByText(/grammatical range/i)).toBeInTheDocument();
  });

  it("gives every chart a readable summary, not just pixels", async () => {
    render(<AccountPage />);

    // Each chart carries both a visible hint and a visually-hidden summary, so these
    // deliberately assert presence rather than uniqueness.
    expect(await screen.findByText(/bands from .* across \d+ submissions/i)).toBeInTheDocument();
    expect(screen.getAllByText(/average bands by criterion/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/words written per week/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/active days out of the last/i).length).toBeGreaterThan(0);
  });

  it("lists graded essays with a link into the stored result", async () => {
    const user = userEvent.setup();
    render(<AccountPage />);

    await user.click(await screen.findByRole("tab", { name: /writing history/i }));

    const rows = await screen.findAllByRole("listitem");
    expect(rows.length).toBeGreaterThan(0);
    const links = screen.getAllByRole("link", { name: /view result/i });
    expect(links[0]).toHaveAttribute("href", expect.stringMatching(/^\/results\/sub_/));
  });

  it("filters history by task", async () => {
    const user = userEvent.setup();
    render(<AccountPage />);

    await user.click(await screen.findByRole("tab", { name: /writing history/i }));
    const allRows = (await screen.findAllByRole("listitem")).length;

    await user.click(screen.getByRole("button", { name: "Task 1" }));
    const task1Rows = screen.getAllByRole("listitem").length;

    expect(task1Rows).toBeLessThan(allRows);
    // Scoped to the rows: the filter controls themselves are labelled "Task 2".
    for (const row of screen.getAllByRole("listitem")) {
      expect(within(row).queryByText("Task 2")).not.toBeInTheDocument();
    }
  });

  it("streams recent activity across grading, practice and mock tests", async () => {
    const user = userEvent.setup();
    render(<AccountPage />);

    await user.click(await screen.findByRole("tab", { name: /activity/i }));

    expect((await screen.findAllByText(/practised/i)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/graded a task/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /continue practice/i })[0],
    ).toHaveAttribute("href", expect.stringMatching(/^\/practice\/writing\//));
  });

  it("shows the signed-in account on the profile tab and can log out", async () => {
    const user = userEvent.setup();
    render(<AccountPage />);

    await user.click(await screen.findByRole("tab", { name: /profile/i }));

    // Scoped to the profile panel: the sidebar shows the same email beside the account
    // link, which is the same fact rather than a second one.
    const profile = screen.getByRole("region", { name: /profile/i });
    expect(within(profile).getByText("learner@writewise.app")).toBeInTheDocument();
    expect(within(profile).getByText("Minh Anh")).toBeInTheDocument();

    await user.click(within(profile).getByRole("button", { name: /log out/i }));
    expect(signOut).toHaveBeenCalledOnce();
  });
});
