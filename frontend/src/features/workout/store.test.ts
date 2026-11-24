import { afterEach, describe, expect, it } from "vitest";
import { useWorkout, workoutStorageKey } from "./store";

describe("useWorkout store", () => {
  afterEach(() => {
    useWorkout.getState().resetState();
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
