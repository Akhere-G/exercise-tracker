import { afterEach, describe, expect, it } from "vitest";
import { benchPress, makeActiveExercise, pushUp } from "@/tests/factories";
import { useWorkout, workoutStorageKey } from "./store";

const stored = () =>
  JSON.parse(localStorage.getItem(workoutStorageKey) ?? "null");

describe("useWorkout store", () => {
  afterEach(() => {
    useWorkout.getState().resetState();
  });

  it("merges partial updates and persists the workout to localStorage", () => {
    const startedAt = new Date("2026-11-02T09:00:00Z");
    useWorkout.getState().setWorkoutData({
      routineId: 7,
      routineName: "Push day",
      startedAt,
      exercises: [makeActiveExercise(benchPress, [{ reps: 5, weight: 100 }])],
      currentExerciseId: benchPress.id,
    });
    useWorkout.getState().setWorkoutData({ routineName: "Push day (edited)" });

    expect(useWorkout.getState()).toMatchObject({
      routineId: 7,
      routineName: "Push day (edited)",
    });
    expect(stored().state).toMatchObject({
      routineId: 7,
      routineName: "Push day (edited)",
      startedAt: "2026-11-02T09:00:00.000Z",
      currentExerciseId: benchPress.id,
    });
    expect(stored().state.exercises[0].sets[0]).toMatchObject({
      reps: 5,
      weight: 100,
    });
  });

  it("adds a set to the current exercise only", () => {
    useWorkout.getState().setWorkoutData({
      exercises: [
        makeActiveExercise(benchPress, [{}]),
        makeActiveExercise(pushUp, [{}]),
      ],
      currentExerciseId: pushUp.id,
    });
    useWorkout
      .getState()
      .addSet({ exerciseId: pushUp.id, setIndex: 2, reps: 10 });

    const [bench, push] = useWorkout.getState().exercises;
    expect(bench.sets).toHaveLength(1);
    expect(push.sets).toHaveLength(2);
  });

  it("resets to an empty workout", () => {
    useWorkout
      .getState()
      .setWorkoutData({
        routineId: 7,
        exercises: [makeActiveExercise(benchPress)],
      });
    useWorkout.getState().resetState();
    expect(useWorkout.getState()).toMatchObject({
      routineId: null,
      startedAt: null,
      exercises: [],
      currentExerciseId: 0,
    });
    expect(stored().state.exercises).toEqual([]);
  });

  it("rehydrates a saved workout", async () => {
    localStorage.setItem(
      workoutStorageKey,
      JSON.stringify({
        state: {
          routineId: 3,
          routineName: "Legs",
          exercises: [],
          currentExerciseId: 0,
        },
        version: 0,
      }),
    );
    await useWorkout.persist.rehydrate();
    expect(useWorkout.getState()).toMatchObject({
      routineId: 3,
      routineName: "Legs",
    });
  });
});
