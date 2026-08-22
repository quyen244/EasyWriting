import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AuthScreen from "@/components/auth/AuthScreen";
import { AuthApiError } from "@/lib/auth";

import { render, screen, waitFor } from "../support/render";

const replace = vi.fn();
// One stable router object: a fresh one per call changes effect dependencies on every
// render and makes a single redirect look like a loop.
const router = { replace, push: vi.fn(), prefetch: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const signIn = vi.fn();
const signUp = vi.fn();
const auth = { status: "unauthenticated", account: null, accessToken: null, signIn, signUp };
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => auth }));

beforeEach(() => {
  vi.clearAllMocks();
  signIn.mockResolvedValue(undefined);
  signUp.mockResolvedValue(undefined);
});

describe("AuthScreen", () => {
  it("offers a way back to the landing page and no marketing navigation", () => {
    // The whole point of this screen is that it does not invite the visitor to wander
    // off mid-task. The logo is the one exit.
    render(<AuthScreen mode="signin" />);

    expect(screen.getByRole("link", { name: /back to writewise/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
  });

  it("presents both modes as tabs, with the current one selected", () => {
    render(<AuthScreen mode="signin" />);

    const [logIn, signUpTab] = screen.getAllByRole("tab");
    expect(logIn).toHaveAttribute("aria-selected", "true");
    expect(signUpTab).toHaveAttribute("aria-selected", "false");
    expect(signUpTab).toHaveAttribute("href", "/signup");
  });

  it("names the field that is wrong instead of failing silently", async () => {
    const user = userEvent.setup();
    render(<AuthScreen mode="signin" />);

    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.type(screen.getByLabelText(/password/i), "a-long-password");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(screen.getByText(/does not look like an email/i)).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("requires a password long enough to be accepted, before submitting", async () => {
    const user = userEvent.setup();
    render(<AuthScreen mode="signup" />);

    await user.type(screen.getByLabelText(/email/i), "learner@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it("signs in and lands the learner in the product", async () => {
    const user = userEvent.setup();
    render(<AuthScreen mode="signin" />);

    await user.type(screen.getByLabelText(/email/i), "learner@example.com");
    await user.type(screen.getByLabelText(/password/i), "a-long-password");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => expect(signIn).toHaveBeenCalledWith({
      email: "learner@example.com",
      password: "a-long-password",
    }));
    expect(replace).toHaveBeenCalledWith("/workspace");
  });

  it("keeps the password after a rejected sign-in", async () => {
    // Clearing it forces a retype for what is almost always a typo in the email field.
    signIn.mockRejectedValue(new AuthApiError("INVALID_CREDENTIALS", "nope", 401));
    const user = userEvent.setup();
    render(<AuthScreen mode="signin" />);

    await user.type(screen.getByLabelText(/email/i), "learner@example.com");
    await user.type(screen.getByLabelText(/password/i), "a-long-password");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/not right/i);
    expect(screen.getByLabelText(/password/i)).toHaveValue("a-long-password");
    expect(replace).not.toHaveBeenCalled();
  });

  it("signs up with the display name when one is given", async () => {
    const user = userEvent.setup();
    render(<AuthScreen mode="signup" />);

    await user.type(screen.getByLabelText(/display name/i), "Minh Anh");
    await user.type(screen.getByLabelText(/email/i), "new@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "a-long-password");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(signUp).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "a-long-password",
        display_name: "Minh Anh",
      }),
    );
    expect(replace).toHaveBeenCalledWith("/workspace");
  });

  it("renders in Vietnamese when the interface is switched", async () => {
    const user = userEvent.setup();
    render(<AuthScreen mode="signin" />);

    await user.click(screen.getAllByRole("button", { name: "VI" })[0]);

    expect(screen.getByText("Đăng nhập để tiếp tục luyện viết tiếng Anh.")).toBeInTheDocument();
    // The brand is never translated.
    expect(screen.getAllByText(/WriteWise/).length).toBeGreaterThan(0);
  });
});
