import { act, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WorkoutClientProvider from "@/src/app/(dashboard)/workouts/active/components/WorkoutClientProvider";
import { useWorkout, workoutStorageKey } from "@/src/features/workout/store";
import { useTimer } from "@/src/features/timer/store";
import { createWorkout } from "@/src/features/workout/actions";
import { getAllExercises } from "@/src/features/exercises/actions";
import { router } from "@/tests/navigation";
import { toast } from "sonner";
import {
  benchPress,
  makeActiveExercise,
  makePreviousSet,
  makeRoutine,
  makeRoutineItem,
  pushUp,
  squat,
} from "@/tests/factories";
import { renderWithProviders } from "@/tests/render";
import { Routine } from "@/src/features/routines/types";
import { PreviousSet } from "@/src/features/workout/types";
import { Profile } from "@/src/features/profile/types";

vi.mock("next/navigation", () => import("@/tests/navigation"));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), warning: vi.fn(), success: vi.fn() },
}));
vi.mock("@/src/features/workout/actions", () => ({
  createWorkout: vi.fn(),
  getPreviousSetsForExercises: vi.fn(async () => ({ success: true, data: {} })),
}));
vi.mock("@/src/features/progression/actions", () => ({
  getProgressionSuggestions: vi.fn(async () => ({ success: true, data: [] })),
}));
vi.mock("@/src/features/profile/actions", () => ({
  saveExerciseRestTime: vi.fn(),
}));
vi.mock("@/src/features/exercises/actions", () => ({
  getAllExercises: vi.fn(async () => []),
}));
vi.mock("@/src/features/routines/actions", () => ({
  createRoutineFromWorkout: vi.fn(),
  syncRoutineFromWorkout: vi.fn(),
}));

const benchFirst = makeRoutine({
  routineItems: [
    makeRoutineItem(benchPress, {
      targetSets: 2,
      targetReps: 5,
      restSecs: 90,
      order: 0,
    }),
    makeRoutineItem(pushUp, { targetSets: 1, targetReps: 15, order: 1 }),
  ],
});

const lastBench: PreviousSet[] = [
  makePreviousSet({
    exerciseId: benchPress.id,
    setIndex: 1,
    reps: 5,
    weight: 100,
  }),
  makePreviousSet({
    exerciseId: benchPress.id,
    setIndex: 2,
    reps: 5,
    weight: 102.5,
  }),
];

function renderWorkout({
  routine = benchFirst,
  previous = { [benchPress.id]: lastBench },
  profile,
}: {
  routine?: Routine | null;
  previous?: Record<number, PreviousSet[]>;
  profile?: Partial<Profile>;
} = {}) {
  return renderWithProviders(
    <WorkoutClientProvider routine={routine} initialPreviousSets={previous} />,
    { profile },
  );
}

const savedWorkout = () => vi.mocked(createWorkout).mock.calls[0][0];
const rows = () =>
  within(screen.getAllByRole("table")[0]).getAllByRole("row").slice(1);

beforeEach(() => {
  vi.mocked(createWorkout).mockResolvedValue({
    success: true,
    data: {
      id: 41,
      routineId: 7,
      completedAt: new Date(),
      duration: 1800,
      sets: [],
    },
  });
});

afterEach(() => {
  act(() => {
    useWorkout.getState().resetState();
    useTimer.getState().clear();
  });
});

describe("active workout from a routine", () => {
  it("prefills sets from routine targets and last session's weights", async () => {
    renderWorkout();

    expect(
      await screen.findByRole("heading", { name: "Bench Press" }),
    ).toBeInTheDocument();
    expect(rows()).toHaveLength(2);
    expect(
      screen.getByRole("spinbutton", { name: "Set 1 weight" }),
    ).toHaveValue(100);
    expect(
      screen.getByRole("spinbutton", { name: "Set 2 weight" }),
    ).toHaveValue(102.5);
    expect(screen.getByRole("spinbutton", { name: "Set 1 reps" })).toHaveValue(
      5,
    );
    expect(
      screen.getByRole("button", { name: "Use last session's 100×5" }),
    ).toBeInTheDocument();
  });

  it("shows weights in lb and stores what the user types back in kg", async () => {
    const { user } = renderWorkout({ profile: { weightUnit: "lb" } });

    const weight = await screen.findByRole("spinbutton", {
      name: "Set 1 weight",
    });
    expect(weight).toHaveValue(220.5);

    await user.clear(weight);
    await user.type(weight, "225{Enter}");

    expect(useWorkout.getState().exercises[0].sets[0].weight).toBe(102.058);
    expect(weight).toHaveValue(225);
  });

  it("starts the routine's rest timer when a set is completed", async () => {
    const { user } = renderWorkout();

    await user.click(
      (await screen.findAllByRole("button", { name: "Complete set" }))[0],
    );

    expect(useTimer.getState()).toMatchObject({
      isRunning: true,
      currentTime: 90,
    });
    expect(
      screen.getByRole("button", { name: "Mark set incomplete" }),
    ).toBeInTheDocument();
  });

  it("refuses to complete a set with no reps", async () => {
    const { user } = renderWorkout();
    const reps = await screen.findByRole("spinbutton", { name: "Set 1 reps" });
    act(() => {
      const [bench, ...rest] = useWorkout.getState().exercises;
      useWorkout.getState().setWorkoutData({
        exercises: [
          { ...bench, sets: bench.sets.map((s) => ({ ...s, reps: 0 })) },
          ...rest,
        ],
      });
    });
    expect(reps).toHaveValue(0);

    await user.click(
      screen.getAllByRole("button", { name: "Complete set" })[0],
    );

    expect(toast.error).toHaveBeenCalledWith(
      "Cannot complete set with reps less than 1.",
    );
    expect(useWorkout.getState().exercises[0].sets[0].isCompleted).toBe(false);
  });

  it("adds a set that repeats the previous working set", async () => {
    const { user } = renderWorkout();
    await screen.findByRole("heading", { name: "Bench Press" });

    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(rows()).toHaveLength(3);
    expect(
      screen.getByRole("spinbutton", { name: "Set 3 weight" }),
    ).toHaveValue(102.5);
  });

  it("saves only completed sets and offers to update the routine when it was not followed", async () => {
    const { user } = renderWorkout();
    await user.click(
      (await screen.findAllByRole("button", { name: "Complete set" }))[0],
    );

    await user.click(screen.getByRole("button", { name: "Complete Workout" }));

    await waitFor(() => expect(createWorkout).toHaveBeenCalledTimes(1));
    expect(savedWorkout()).toMatchObject({
      routineId: 7,
      sets: [
        expect.objectContaining({
          exerciseId: benchPress.id,
          reps: 5,
          weight: 100,
          isCompleted: true,
        }),
      ],
    });
    expect(savedWorkout().sets).toHaveLength(1);
    expect(savedWorkout().duration).toBeGreaterThanOrEqual(0);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(localStorage.getItem(workoutStorageKey) ?? "").not.toContain(
      "Bench Press",
    );
  });

  it("goes straight to the summary when the routine was followed exactly", async () => {
    const { user } = renderWorkout();
    await screen.findByRole("heading", { name: "Bench Press" });

    for (const button of screen.getAllByRole("button", {
      name: "Complete set",
    })) {
      await user.click(button);
    }
    // Completing bench moves on to push ups.
    expect(
      await screen.findByRole("heading", { name: "Push Up" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Complete set" }));
    expect(useTimer.getState().isRunning).toBe(false);

    await user.click(screen.getByRole("button", { name: "Complete Workout" }));

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith(
        "/workouts/summary/41?first=true",
      ),
    );
    expect(savedWorkout().sets).toHaveLength(3);
  });

  it("keeps the workout and lets the user retry when saving fails", async () => {
    vi.mocked(createWorkout).mockResolvedValueOnce({
      success: false,
      error: "Server unavailable",
    });
    const { user } = renderWorkout();
    await user.click(
      (await screen.findAllByRole("button", { name: "Complete set" }))[0],
    );

    const finish = screen.getByRole("button", { name: "Complete Workout" });
    await user.click(finish);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Server unavailable"),
    );
    expect(finish).toBeEnabled();
    expect(useWorkout.getState().exercises).toHaveLength(2);
    expect(localStorage.getItem(workoutStorageKey)).toContain("Bench Press");

    await user.click(finish);
    await waitFor(() => expect(createWorkout).toHaveBeenCalledTimes(2));
  });

  it("submits only once when Complete is pressed repeatedly", async () => {
    let resolve: (
      value: Awaited<ReturnType<typeof createWorkout>>,
    ) => void = () => {};
    vi.mocked(createWorkout).mockImplementationOnce(
      () => new Promise((r) => (resolve = r)),
    );
    const { user } = renderWorkout();
    await user.click(
      (await screen.findAllByRole("button", { name: "Complete set" }))[0],
    );

    const finish = screen.getByRole("button", { name: "Complete Workout" });
    await user.click(finish);
    await user.click(finish);

    expect(createWorkout).toHaveBeenCalledTimes(1);
    await act(async () =>
      resolve({
        success: true,
        data: {
          id: 41,
          routineId: 7,
          completedAt: new Date(),
          duration: 60,
          sets: [],
        },
      }),
    );
  });

  it("does not crash on a routine with no exercises", async () => {
    renderWorkout({ routine: makeRoutine({ routineItems: [] }) });
    expect(
      await screen.findByRole("heading", { name: "No exercises" }),
    ).toBeInTheDocument();
  });
});

describe("resuming and recovering a workout", () => {
  it("resumes the saved workout instead of rebuilding it from the routine", async () => {
    localStorage.setItem(
      workoutStorageKey,
      JSON.stringify({
        state: {
          routineId: 7,
          routineName: "Push day",
          startedAt: new Date().toISOString(),
          duration: null,
          currentExerciseId: benchPress.id,
          exercises: [
            makeActiveExercise(benchPress, [
              { reps: 3, weight: 120, isCompleted: true },
            ]),
          ],
        },
        version: 0,
      }),
    );

    renderWorkout();

    expect(
      await screen.findByRole("spinbutton", { name: "Set 1 weight" }),
    ).toHaveValue(120);
    expect(rows()).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Mark set incomplete" }),
    ).toBeInTheDocument();
  });

  it("starts fresh from the routine when the saved workout is corrupt", async () => {
    localStorage.setItem(workoutStorageKey, "{not json");

    renderWorkout();

    expect(
      await screen.findByRole("spinbutton", { name: "Set 1 weight" }),
    ).toHaveValue(100);
  });
});

describe("workout menu", () => {
  it("removing an exercise moves on to the first unfinished one", async () => {
    const routine = makeRoutine({
      routineItems: [
        makeRoutineItem(benchPress, { targetSets: 1, order: 0 }),
        makeRoutineItem(squat, { targetSets: 1, order: 1 }),
        makeRoutineItem(pushUp, { targetSets: 1, order: 2 }),
      ],
    });
    const { user } = renderWorkout({ routine, previous: {} });

    // Finish bench (moves to squat), then go to push ups and remove them.
    await user.click(
      await screen.findByRole("button", { name: "Complete set" }),
    );
    await user.click(screen.getByRole("button", { name: "Push Up" }));
    expect(
      await screen.findByRole("heading", { name: "Push Up" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Exercise options" }));
    await user.click(
      await screen.findByRole("menuitem", { name: "Remove Exercise" }),
    );
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Delete",
      }),
    );

    expect(
      await screen.findByRole("heading", { name: "Squat" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Push Up" }),
    ).not.toBeInTheDocument();
  });

  it("supersets skip rest between exercises and rest after the round", async () => {
    const routine = makeRoutine({
      routineItems: [
        makeRoutineItem(benchPress, {
          targetSets: 1,
          order: 0,
          supersetGroup: 1,
          restSecs: 120,
        }),
        makeRoutineItem(squat, { targetSets: 1, order: 1, supersetGroup: 1 }),
        makeRoutineItem(pushUp, { targetSets: 1, order: 2 }),
      ],
    });
    const { user } = renderWorkout({ routine, previous: {} });

    await user.click(
      await screen.findByRole("button", { name: "Complete set" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Squat" }),
    ).toBeInTheDocument();
    expect(useTimer.getState().isRunning).toBe(false);

    await user.click(screen.getByRole("button", { name: "Complete set" }));
    expect(useTimer.getState()).toMatchObject({
      isRunning: true,
      currentTime: 120,
    });
  });

  it("cancelling discards the workout and returns to routines", async () => {
    const { user } = renderWorkout();
    await user.click(
      await screen.findByRole("button", { name: "Exercise options" }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Cancel Workout" }),
    );
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Cancel Workout",
      }),
    );

    expect(useWorkout.getState().exercises).toEqual([]);
    expect(localStorage.getItem(workoutStorageKey)).toBeNull();
    expect(router.push).toHaveBeenCalledWith("/routines");
  });
});

describe("empty workout", () => {
  it("starts timing when the first exercise is added, so the saved duration is real", async () => {
    vi.mocked(getAllExercises).mockImplementation(async ({ page }) =>
      page === 1
        ? [{ ...benchPress, setCount: 0, workoutCount: 3, lastUser: null }]
        : [],
    );
    const { user } = renderWorkout({ routine: null, previous: {} });
    expect(
      await screen.findByRole("heading", { name: "No exercises" }),
    ).toBeInTheDocument();
    expect(useWorkout.getState().startedAt).toBeNull();

    await user.click(screen.getByRole("button", { name: "Add Exercise" }));
    await user.click(
      await screen.findByRole("button", {
        name: /Bench Press/,
        pressed: false,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Add (1)" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("heading", { name: "Bench Press" }),
    ).toBeInTheDocument();
    expect(useWorkout.getState().startedAt).not.toBeNull();

    await user.click(
      screen.getAllByRole("button", { name: "Complete set" })[0],
    );
    await user.click(screen.getByRole("button", { name: "Complete Workout" }));

    await waitFor(() => expect(createWorkout).toHaveBeenCalled());
    expect(savedWorkout().routineId).toBeUndefined();
    expect(savedWorkout().duration).toBeLessThan(60);
  });
});
