import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PreferencesCard from "@/src/app/(dashboard)/settings/components/PreferencesCard";
import GoalsForm from "@/src/app/(dashboard)/settings/components/GoalsForm";
import { updateProfile } from "@/src/features/profile/actions";
import { toast } from "sonner";
import { renderWithProviders } from "@/tests/render";
import { makeProfile } from "@/tests/factories";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/src/features/profile/actions", () => ({ updateProfile: vi.fn() }));

const ok = () =>
  vi
    .mocked(updateProfile)
    .mockResolvedValue({ success: true, data: makeProfile() });

describe("training preferences", () => {
  const personas = [
    { slug: "hype" as const, name: "Hype", tagline: "Big energy" },
    { slug: "physio" as const, name: "Physio", tagline: "Move well" },
  ];

  it("saves the weight unit, effort tracking and coach", async () => {
    ok();
    const { user } = renderWithProviders(
      <PreferencesCard personas={personas} />,
    );

    await user.selectOptions(screen.getByLabelText("Weight unit"), "lb");
    await user.selectOptions(
      screen.getByLabelText("Track effort per set"),
      "rir",
    );
    await user.selectOptions(screen.getByLabelText("Coach"), "physio");

    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(3));
    expect(
      vi.mocked(updateProfile).mock.calls.map(([update]) => update),
    ).toEqual([
      { weightUnit: "lb" },
      { effortMetric: "rir" },
      { coachPersona: "physio" },
    ]);
  });

  it("tells the user when a preference could not be saved", async () => {
    vi.mocked(updateProfile).mockResolvedValue({
      success: false,
      error: "Server unavailable",
    });
    const { user } = renderWithProviders(<PreferencesCard />);

    await user.selectOptions(screen.getByLabelText("Weight unit"), "lb");

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Server unavailable"),
    );
    // The control still reflects the saved profile.
    expect(screen.getByLabelText("Weight unit")).toHaveValue("kg");
    expect(screen.getByLabelText("Weight unit")).toBeEnabled();
  });
});

describe("goals", () => {
  it("saves a new weekly target when the field loses focus", async () => {
    ok();
    const { user } = renderWithProviders(<GoalsForm />, {
      profile: { workoutsPerWeekTarget: 3 },
    });

    const target = screen.getByLabelText("Workouts per week");
    await user.clear(target);
    await user.type(target, "4");
    await user.tab();

    await waitFor(() =>
      expect(updateProfile).toHaveBeenCalledWith({ workoutsPerWeekTarget: 4 }),
    );
  });

  it("does not save when nothing changed", async () => {
    const { user } = renderWithProviders(<GoalsForm />, {
      profile: {
        workoutsPerWeekTarget: 3,
        targetBodyWeightKg: 80,
        weightUnit: "lb",
      },
    });

    await user.click(screen.getByLabelText("Workouts per week"));
    await user.click(screen.getByLabelText("Target body weight (lb)"));
    await user.tab();

    expect(screen.getByLabelText("Target body weight (lb)")).toHaveValue(176.4);
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("converts a target typed in lb to kg, and clearing it removes the goal", async () => {
    ok();
    renderWithProviders(<GoalsForm />, {
      profile: { targetBodyWeightKg: 80, weightUnit: "lb" },
    });
    const field = screen.getByLabelText("Target body weight (lb)");

    fireEvent.blur(field, { target: { value: "165" } });
    await waitFor(() =>
      expect(updateProfile).toHaveBeenLastCalledWith({
        targetBodyWeightKg: 74.843,
      }),
    );

    fireEvent.blur(field, { target: { value: "" } });
    await waitFor(() =>
      expect(updateProfile).toHaveBeenLastCalledWith({
        targetBodyWeightKg: null,
      }),
    );
  });

  it("keeps the next field editable while the previous one saves", async () => {
    let finishFirstSave: () => void = () => {};
    vi.mocked(updateProfile)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishFirstSave = () =>
              resolve({ success: true, data: makeProfile() });
          }),
      )
      .mockResolvedValue({ success: true, data: makeProfile() });
    const { user } = renderWithProviders(<GoalsForm />);

    await user.type(screen.getByLabelText("Workouts per week"), "4");
    await user.click(screen.getByLabelText("Target body weight (kg)"));
    // The first save is still in flight while the user types the next goal.
    await user.keyboard("75");
    await user.tab();
    finishFirstSave();

    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(2));
    expect(
      vi.mocked(updateProfile).mock.calls.map(([update]) => update),
    ).toEqual([{ workoutsPerWeekTarget: 4 }, { targetBodyWeightKg: 75 }]);
  });
});
