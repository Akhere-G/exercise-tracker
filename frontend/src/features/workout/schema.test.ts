import { describe, expect, it } from "vitest";
import { workoutSchema, workoutSetSchema } from "./schema";

describe("workoutSetSchema", () => {
  it("needs positive reps or a positive duration", () => {
    expect(workoutSetSchema.isValidSync({ exerciseId: 1, reps: 5 })).toBe(true);
    expect(
      workoutSetSchema.isValidSync({ exerciseId: 1, durationSecs: 30 }),
    ).toBe(true);
    expect(
      workoutSetSchema.isValidSync({ exerciseId: 1, reps: 0, durationSecs: 0 }),
    ).toBe(false);
    expect(workoutSetSchema.isValidSync({ exerciseId: 1 })).toBe(false);
  });

  it("bounds RPE to 1–10 and RIR to 0–10", () => {
    expect(
      workoutSetSchema.isValidSync({ exerciseId: 1, reps: 5, rpe: 10 }),
    ).toBe(true);
    expect(
      workoutSetSchema.isValidSync({ exerciseId: 1, reps: 5, rpe: 0 }),
    ).toBe(false);
    expect(
      workoutSetSchema.isValidSync({ exerciseId: 1, reps: 5, rir: 0 }),
    ).toBe(true);
    expect(
      workoutSetSchema.isValidSync({ exerciseId: 1, reps: 5, rir: 11 }),
    ).toBe(false);
  });

  it("only allows known set types", () => {
    expect(
      workoutSetSchema.isValidSync({ exerciseId: 1, reps: 5, setType: "drop" }),
    ).toBe(true);
    expect(
      workoutSetSchema.isValidSync({
        exerciseId: 1,
        reps: 5,
        setType: "superset",
      }),
    ).toBe(false);
  });
});

describe("workoutSchema", () => {
  const workout = {
    completedAt: new Date(),
    duration: 600,
    sets: [{ exerciseId: 1, reps: 5 }],
  };

  it("requires at least one set and a non-negative duration", async () => {
    expect(workoutSchema.isValidSync(workout)).toBe(true);
    await expect(
      workoutSchema.validate({ ...workout, sets: [] }),
    ).rejects.toThrow("A workout must contain at least one set.");
    await expect(
      workoutSchema.validate({ ...workout, duration: -1 }),
    ).rejects.toThrow("Duration cannot be negative");
  });
});
