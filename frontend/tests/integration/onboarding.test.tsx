import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OnboardingFlow from "@/src/features/onboarding/components/OnboardingFlow";
import {
  completeOnboarding,
  skipOnboarding,
} from "@/src/features/onboarding/actions";
import { router } from "@/tests/navigation";
import { toast } from "sonner";
import { renderWithProviders } from "@/tests/render";
import { makeProfile } from "@/tests/factories";

vi.mock("next/navigation", () => import("@/tests/navigation"));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/src/features/onboarding/actions", () => ({
  completeOnboarding: vi.fn(),
  skipOnboarding: vi.fn(),
}));

const personas = [
  { slug: "hype" as const, name: "Hype", tagline: "Big energy" },
  { slug: "drill" as const, name: "Drill", tagline: "No excuses" },
];

const choose = async (
  user: ReturnType<typeof renderWithProviders>["user"],
  name: RegExp,
) => {
  await user.click(screen.getByRole("button", { name }));
  await user.click(screen.getByRole("button", { name: "Next" }));
};

describe("onboarding", () => {
  it("only moves on once the step is answered, then saves every answer", async () => {
    vi.mocked(completeOnboarding).mockResolvedValue({
      success: true,
      data: makeProfile(),
    });
    const { user } = renderWithProviders(
      <OnboardingFlow personas={personas} />,
    );

    expect(
      screen.getByRole("heading", { name: "What is your main goal?" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    await choose(user, /Build muscle/);
    await choose(user, /Intermediate/);
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(
      screen.getByRole("button", { name: /Intermediate/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await choose(user, /4 days/);

    expect(
      screen.getByRole("heading", { name: "A bit about you" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "lb" }));
    await user.type(screen.getByLabelText("Body weight (lb, optional)"), "180");
    await choose(user, /Prefer not to say/);

    await user.click(screen.getByRole("button", { name: /Drill/ }));
    await user.click(screen.getByRole("button", { name: "Finish" }));

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/routines"),
    );
    expect(completeOnboarding).toHaveBeenCalledWith({
      goal: "hypertrophy",
      experience: "intermediate",
      workoutsPerWeek: 4,
      weightUnit: "lb",
      sex: "unspecified",
      bodyWeightKg: 81.647,
      coachPersona: "drill",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  });

  it("stays on the last step and explains a failed save", async () => {
    vi.mocked(completeOnboarding).mockResolvedValue({
      success: false,
      error: "Could not reach the server.",
    });
    const { user } = renderWithProviders(
      <OnboardingFlow personas={personas} />,
    );
    await choose(user, /Get stronger/);
    await choose(user, /Beginner/);
    await choose(user, /3 days/);
    await choose(user, /Female/);

    await user.click(screen.getByRole("button", { name: "Finish" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Could not reach the server."),
    );
    expect(screen.getByRole("button", { name: "Finish" })).toBeEnabled();
    expect(
      vi.mocked(completeOnboarding).mock.calls[0][0].bodyWeightKg,
    ).toBeNull();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("can be skipped, and stays put if skipping fails", async () => {
    vi.mocked(skipOnboarding).mockResolvedValueOnce({
      success: false,
      error: "Try again",
    });
    vi.mocked(skipOnboarding).mockResolvedValueOnce({
      success: true,
      data: makeProfile(),
    });
    const { user } = renderWithProviders(
      <OnboardingFlow personas={personas} />,
    );

    await user.click(screen.getByRole("button", { name: "Skip" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Try again"));
    expect(router.replace).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Skip" }));
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/routines"),
    );
  });
});
