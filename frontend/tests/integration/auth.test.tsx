import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Login from "@/src/app/(auth)/login/page";
import Register from "@/src/app/(auth)/register/page";
import {
  demoLoginAction,
  loginAction,
  registerAction,
} from "@/src/features/auth/actions";
import { router } from "@/tests/navigation";
import { renderWithProviders } from "@/tests/render";

vi.mock("next/navigation", () => import("@/tests/navigation"));
vi.mock("@/src/features/auth/actions", () => ({
  loginAction: vi.fn(),
  registerAction: vi.fn(),
  demoLoginAction: vi.fn(),
}));

describe("login page", () => {
  it("validates before calling the server", async () => {
    const { user } = renderWithProviders(<Login />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("email must be a valid email"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("password must be at least 8 characters"),
    ).toBeInTheDocument();
    expect(loginAction).not.toHaveBeenCalled();
  });

  it("logs in with a lower-cased email and goes to routines", async () => {
    vi.mocked(loginAction).mockResolvedValue({ success: true, data: null });
    const { user } = renderWithProviders(<Login />);

    await user.type(screen.getByLabelText("Email"), "Sam@Example.COM");
    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/routines"));
    expect(loginAction).toHaveBeenCalledWith({
      email: "sam@example.com",
      password: "Password1",
    });
  });

  it("shows the server's reason when login fails", async () => {
    vi.mocked(loginAction).mockResolvedValue({
      success: false,
      error: "Incorrect email or password",
    });
    const { user } = renderWithProviders(<Login />);

    await user.type(screen.getByLabelText("Email"), "sam@example.com");
    await user.type(screen.getByLabelText("Password"), "Password9");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Incorrect email or password",
    );
    expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("explains when the demo is unavailable", async () => {
    vi.mocked(demoLoginAction).mockResolvedValue({
      success: false,
      error: "Not found",
      status: 404,
    });
    const { user } = renderWithProviders(<Login />);

    await user.click(screen.getByRole("button", { name: "Try demo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The demo is temporarily unavailable.",
    );
  });
});

describe("register page", () => {
  const fill = async (
    user: ReturnType<typeof renderWithProviders>["user"],
    repeat = "Password1",
  ) => {
    await user.type(screen.getByLabelText("Username"), "sam");
    await user.type(screen.getByLabelText("Email"), "Sam@Example.com");
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "Password1",
    );
    await user.type(screen.getByLabelText("Repeat Password"), repeat);
  };

  it("requires the passwords to match", async () => {
    const { user } = renderWithProviders(<Register />);
    await fill(user, "Password2");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Passwords must match")).toBeInTheDocument();
    expect(registerAction).not.toHaveBeenCalled();
  });

  it("creates the account and continues into the app", async () => {
    vi.mocked(registerAction).mockResolvedValue({ success: true, data: null });
    const { user } = renderWithProviders(<Register />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/routines"));
    expect(registerAction).toHaveBeenCalledWith(
      expect.objectContaining({ email: "sam@example.com", username: "sam" }),
    );
  });

  it("shows why registration failed", async () => {
    vi.mocked(registerAction).mockResolvedValue({
      success: false,
      error: "Email already registered",
      status: 400,
    });
    const { user } = renderWithProviders(<Register />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email already registered",
    );
  });
});
