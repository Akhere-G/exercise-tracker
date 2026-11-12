import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import WorkoutForm from "@/src/app/(dashboard)/workouts/components/WorkoutForm";
import { router } from "@/tests/navigation";
import { toast } from "sonner";
import {
  benchPress,
  makeWorkout,
  makeWorkoutSet,
  plank,
} from "@/tests/factories";
import { renderWithProviders } from "@/tests/render";

vi.mock("next/navigation", () => import("@/tests/navigation"));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/src/features/exercises/actions", () => ({
  getAllExercises: vi.fn(async () => []),
}));

const workout = makeWorkout(
  [
    makeWorkoutSet(benchPress, { id: 1, setIndex: 1, reps: 5, weight: 100 }),
    makeWorkoutSet(benchPress, { id: 2, setIndex: 2, reps: 5, weight: 100 }),
    makeWorkoutSet(plank, { id: 3, setIndex: 1, durationSecs: 60 }),
  ],
  { id: 11, duration: 2700, completedAt: new Date("2026-11-02T10:00:00Z") },
);

const submitAction = vi.fn();
const renderEdit = (profile?: { weightUnit: "kg" | "lb" }) =>
  renderWithProviders(
    <WorkoutForm
      submitAction={submitAction}
      submitText="Save"
      initialData={workout}
    />,
    { profile },
  );

describe("editing a logged workout", () => {
  it("loads the workout with duration in minutes and local time", async () => {
    renderEdit();

    expect(await screen.findByLabelText("Duration (minutes)")).toHaveValue(45);
    expect(screen.getByLabelText("Completed At")).toHaveValue(
      "2026-11-02T15:30",
    );
    const bench = screen.getByRole("group", { name: "Bench Press" });
    expect(
      within(bench).getAllByRole("spinbutton", { name: /weight/ }),
    ).toHaveLength(2);
    expect(
      within(screen.getByRole("group", { name: "Plank" })).getByRole(
        "textbox",
        { name: "Set 1 duration" },
      ),
    ).toHaveValue("01:00");
  });

  it("saves edited sets and an added set", async () => {
    submitAction.mockResolvedValue({ success: true, data: { id: 11 } });
    const { user } = renderEdit({ weightUnit: "lb" });
    const bench = await screen.findByRole("group", { name: "Bench Press" });

    const weight = within(bench).getByRole("spinbutton", {
      name: "Set 2 weight",
    });
    expect(weight).toHaveValue(220.5);
    await user.clear(weight);
    await user.type(weight, "225{Enter}");
    await user.click(within(bench).getByRole("button", { name: "Add Set" }));
    await user.clear(screen.getByLabelText("Duration (minutes)"));
    await user.type(screen.getByLabelText("Duration (minutes)"), "50");

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(submitAction).toHaveBeenCalled());
    const saved = submitAction.mock.calls[0][0];
    expect(saved.duration).toBe(50);
    const benchSets = saved.sets.filter(
      (s: { exerciseId: number }) => s.exerciseId === benchPress.id,
    );
    expect(
      benchSets.map((s: { setIndex: number; weight: number }) => [
        s.setIndex,
        s.weight,
      ]),
    ).toEqual([
      [1, 100],
      [2, 102.058],
      [3, 25],
    ]);
    expect(router.push).toHaveBeenCalledWith("/workouts/summary/11");
  });

  it("removes the last set and whole exercises", async () => {
    submitAction.mockResolvedValue({ success: true, data: { id: 11 } });
    const { user } = renderEdit();
    const bench = await screen.findByRole("group", { name: "Bench Press" });

    await user.click(
      within(bench).getByRole("button", { name: "Remove Last" }),
    );
    expect(
      within(bench).getAllByRole("spinbutton", { name: /weight/ }),
    ).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Plank options" }));
    await user.click(
      await screen.findByRole("menuitem", { name: "Remove Exercise" }),
    );
    expect(
      screen.queryByRole("group", { name: "Plank" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(submitAction).toHaveBeenCalled());
    expect(submitAction.mock.calls[0][0].sets).toHaveLength(1);
  });

  it("will not save a workout with no sets", async () => {
    const { user } = renderEdit();
    await user.click(
      await screen.findByRole("button", { name: "Bench Press options" }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Remove Exercise" }),
    );
    await user.click(screen.getByRole("button", { name: "Plank options" }));
    await user.click(
      await screen.findByRole("menuitem", { name: "Remove Exercise" }),
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("A workout must contain at least one set."),
    ).toBeInTheDocument();
    expect(submitAction).not.toHaveBeenCalled();
  });

  it("reports a failed save", async () => {
    submitAction.mockResolvedValue({
      success: false,
      error: "Workout not found",
    });
    const { user } = renderEdit();
    await user.click(await screen.findByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Workout not found"),
    );
    expect(router.push).not.toHaveBeenCalled();
  });
});
