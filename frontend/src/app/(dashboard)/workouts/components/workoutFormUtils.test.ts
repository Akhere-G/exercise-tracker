import { describe, expect, it } from "vitest";
import { benchPress, makeWorkout, makeWorkoutSet, plank, pushUp } from "@/tests/factories";
import {
  buildDefaultSet,
  buildSetsFromWorkout,
  groupByExercise,
  toDatetimeLocal,
} from "./workoutFormUtils";

describe("buildDefaultSet", () => {
  it("only fills in the metrics the exercise tracks", () => {
    expect(buildDefaultSet(benchPress, 2)).toMatchObject({
      exerciseId: benchPress.id,
      setIndex: 2,
      reps: 10,
      weight: 25,
    });
    expect(buildDefaultSet(plank, 1).reps).toBeUndefined();
    expect(buildDefaultSet(plank, 1).durationSecs).toBeDefined();
  });
});

describe("buildSetsFromWorkout", () => {
  it("converts null API values to undefined so the form can edit them", () => {
    const workout = makeWorkout([
      makeWorkoutSet(benchPress, {
        reps: 5,
        weight: null as unknown as undefined,
        distanceMeters: null as unknown as undefined,
      }),
    ]);

    const [row] = buildSetsFromWorkout(workout);

    expect(row.reps).toBe(5);
    expect(row.weight).toBeUndefined();
    expect(row.distanceMeters).toBeUndefined();
    expect(row.exercise).toBe(benchPress);
  });
});

describe("groupByExercise", () => {
  it("groups row indices by exercise in first-seen order", () => {
    const rows = buildSetsFromWorkout(
      makeWorkout([
        makeWorkoutSet(benchPress, { reps: 5 }),
        makeWorkoutSet(pushUp, { reps: 10 }),
        makeWorkoutSet(benchPress, { reps: 4 }),
      ]),
    );

    const groups = groupByExercise(rows);

    expect(groups.map((g) => g.exercise.id)).toEqual([benchPress.id, pushUp.id]);
    expect(groups[0].indices).toEqual([0, 2]);
    expect(groups[1].indices).toEqual([1]);
  });

  it("handles an empty list", () => {
    expect(groupByExercise([])).toEqual([]);
  });
});

describe("toDatetimeLocal", () => {
  it("formats a date in local time for datetime-local inputs", () => {
    expect(toDatetimeLocal(new Date(2025, 0, 6, 9, 5))).toBe("2025-01-06T09:05");
  });

  it("accepts ISO strings and rejects missing or invalid input", () => {
    expect(toDatetimeLocal(new Date(2025, 0, 6, 9, 5).toISOString())).toBe("2025-01-06T09:05");
    expect(toDatetimeLocal(null)).toBe("");
    expect(toDatetimeLocal(undefined)).toBe("");
    expect(toDatetimeLocal("garbage")).toBe("");
  });
});
