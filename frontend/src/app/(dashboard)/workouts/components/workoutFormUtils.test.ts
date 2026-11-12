import { describe, expect, it } from "vitest";
import {
  benchPress,
  makeWorkout,
  makeWorkoutSet,
  plank,
  pushUp,
} from "@/tests/factories";
import {
  buildSetsFromWorkout,
  groupByExercise,
  toDatetimeLocal,
} from "./workoutFormUtils";

describe("workout edit form helpers", () => {
  it("turns API nulls into empty form fields", () => {
    const [row] = buildSetsFromWorkout(
      makeWorkout([
        makeWorkoutSet(benchPress, {
          reps: 5,
          weight: null as never,
          rpe: null,
        }),
      ]),
    );
    expect(row).toMatchObject({
      exerciseId: benchPress.id,
      reps: 5,
      weight: undefined,
      rpe: undefined,
    });
  });

  it("groups set rows by exercise in first-seen order", () => {
    const rows = buildSetsFromWorkout(
      makeWorkout([
        makeWorkoutSet(pushUp, { id: 1 }),
        makeWorkoutSet(benchPress, { id: 2 }),
        makeWorkoutSet(pushUp, { id: 3, setIndex: 2 }),
        makeWorkoutSet(plank, { id: 4 }),
      ]),
    );
    expect(
      groupByExercise(rows).map((g) => [g.exercise.name, g.indices]),
    ).toEqual([
      ["Push Up", [0, 2]],
      ["Bench Press", [1]],
      ["Plank", [3]],
    ]);
  });

  it("formats dates for a datetime-local input in local time", () => {
    // Asia/Kolkata is UTC+05:30.
    expect(toDatetimeLocal(new Date("2026-11-02T20:00:00Z"))).toBe(
      "2026-11-03T01:30",
    );
    expect(toDatetimeLocal("2026-11-02T10:15:00Z")).toBe("2026-11-02T15:45");
    expect(toDatetimeLocal(null)).toBe("");
    expect(toDatetimeLocal("not a date")).toBe("");
  });
});
