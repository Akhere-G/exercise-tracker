import { act, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StartEmptyWorkoutButton from "@/src/app/(dashboard)/components/StartEmptyWorkoutButton";
import StoredWorkout from "@/src/app/(dashboard)/routines/components/StoredWorkout";
import WorkoutsCalendar from "@/src/app/(dashboard)/components/WorkoutCalendar";
import DeloadBanner from "@/src/features/progression/components/DeloadBanner";
import { useWorkout, workoutStorageKey } from "@/src/features/workout/store";
import { getWorkoutsInRange } from "@/src/features/workout/actions";
import { router } from "@/tests/navigation";
import { benchPress, makeActiveExercise, makeWorkout } from "@/tests/factories";
import { renderWithProviders } from "@/tests/render";
import { weekKey } from "@/src/features/progression/utils";

vi.mock("next/navigation", () => import("@/tests/navigation"));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/src/features/workout/actions", () => ({
  getWorkoutsInRange: vi.fn(),
}));

afterEach(() => {
  act(() => useWorkout.getState().resetState());
  vi.useRealTimers();
});

const saveWorkoutInProgress = (
  routineId: number | null,
  routineName: string | null,
) =>
  localStorage.setItem(
    workoutStorageKey,
    JSON.stringify({
      state: {
        routineId,
        routineName,
        startedAt: new Date(Date.now() - 125_000).toISOString(),
        duration: null,
        currentExerciseId: benchPress.id,
        exercises: [makeActiveExercise(benchPress, [{ reps: 5, weight: 100 }])],
      },
      version: 0,
    }),
  );

describe("starting an empty workout", () => {
  it("goes straight to a fresh workout when none is in progress", async () => {
    const { user } = renderWithProviders(<StartEmptyWorkoutButton />);
    await user.click(
      screen.getByRole("button", { name: "Start Empty Workout" }),
    );
    expect(router.push).toHaveBeenCalledWith("/workouts/active");
  });

  it("asks before replacing a workout in progress, and resumes it without a bogus routine id", async () => {
    act(() =>
      useWorkout
        .getState()
        .setWorkoutData({ routineId: 7, startedAt: new Date() }),
    );
    const { user } = renderWithProviders(<StartEmptyWorkoutButton />);

    await user.click(
      screen.getByRole("button", { name: "Start Empty Workout" }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "You have a workout in progress",
    });

    await user.click(
      within(dialog).getByRole("button", { name: "Resume current workout" }),
    );
    expect(router.push).toHaveBeenLastCalledWith(
      "/workouts/active?routineId=7",
    );

    await user.click(
      within(dialog).getByRole("button", { name: "Start new workout" }),
    );
    expect(router.push).toHaveBeenLastCalledWith("/workouts/active");
    expect(useWorkout.getState().routineId).toBeNull();
  });
});

describe("workout in progress card", () => {
  it("shows the routine and elapsed time, and links back to the workout", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    saveWorkoutInProgress(7, "Push day");
    const { user } = renderWithProviders(<StoredWorkout />);

    const resume = await screen.findByRole("button", {
      name: "Resume workout: Push day",
    });
    expect(screen.getByText(/02:05/)).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(3000));
    expect(screen.getByText(/02:08/)).toBeInTheDocument();

    await user.click(resume);
    expect(router.push).toHaveBeenCalledWith("/workouts/active?routineId=7");
  });

  it("labels a standalone workout and stops its timer when unmounted", async () => {
    saveWorkoutInProgress(null, null);
    const clearInterval = vi.spyOn(globalThis, "clearInterval");
    const { user, unmount } = renderWithProviders(<StoredWorkout />);

    await user.click(
      await screen.findByRole("button", {
        name: "Resume workout: Standalone workout",
      }),
    );
    expect(router.push).toHaveBeenCalledWith("/workouts/active");

    unmount();
    expect(clearInterval).toHaveBeenCalled();
  });

  it("shows nothing without a workout in progress", () => {
    const { container } = renderWithProviders(<StoredWorkout />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("workout calendar", () => {
  it("places a late-evening workout on the user's local day", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true, now: new Date(2026, 10, 15) });
    // 20:00 UTC on 2 Nov is 01:30 on 3 Nov in UTC+05:30.
    vi.mocked(getWorkoutsInRange).mockResolvedValue({
      success: true,
      data: [
        makeWorkout([], {
          id: 5,
          completedAt: new Date("2026-11-02T20:00:00Z"),
        }),
      ],
    });
    renderWithProviders(<WorkoutsCalendar />);

    const link = await screen.findByRole("link", {
      name: "Workout on 2026-11-03",
    });
    expect(link).toHaveAttribute("href", "/workouts/summary/5");
    expect(getWorkoutsInRange).toHaveBeenCalledWith("2026-11-01", "2026-11-30");
  });

  it("loads the previous month", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true, now: new Date(2026, 0, 10) });
    vi.mocked(getWorkoutsInRange).mockResolvedValue({
      success: true,
      data: [],
    });
    const { user } = renderWithProviders(<WorkoutsCalendar />);

    await user.click(screen.getByRole("button", { name: "Previous month" }));

    expect(
      await screen.findByRole("heading", { name: /December 2025/ }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(getWorkoutsInRange).toHaveBeenLastCalledWith(
        "2025-12-01",
        "2025-12-31",
      ),
    );
  });
});

describe("deload banner", () => {
  const assessment: Parameters<typeof DeloadBanner>[0]["assessment"] = {
    shouldDeload: true,
    message: "Time for a lighter week",
    reasons: ["Bench Press has stalled for 3 weeks"],
    stalledExercises: [
      {
        exerciseId: 1,
        name: "Bench Press",
        reason: "stalled",
        changePercent: 0,
      },
    ],
    suggestion: { volumePercent: 60, maxRpe: 7 },
  };

  it("explains why a deload is suggested and stays dismissed for the week", async () => {
    const { user, unmount } = renderWithProviders(
      <DeloadBanner assessment={assessment} />,
    );

    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent("Bench Press has stalled for 3 weeks");
    expect(banner).toHaveTextContent("about 60% of your usual volume");

    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    unmount();
    renderWithProviders(<DeloadBanner assessment={assessment} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("comes back the following week", () => {
    localStorage.setItem(
      "deload-dismissed-week",
      weekKey(new Date(Date.now() - 7 * 86_400_000)),
    );
    renderWithProviders(<DeloadBanner assessment={assessment} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows nothing when no deload is needed", () => {
    renderWithProviders(
      <DeloadBanner assessment={{ ...assessment, shouldDeload: false }} />,
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
