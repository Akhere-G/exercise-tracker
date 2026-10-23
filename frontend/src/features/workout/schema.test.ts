import { describe, expect, it } from "vitest";
import { workoutSchema, workoutSetSchema } from "./schema";

const validSet = { exerciseId: 1, setIndex: 1, reps: 5, weight: 60 };
const validWorkout = {
  completedAt: new Date("2025-01-06T10:00:00Z"),
  duration: 1800,
  sets: [validSet],
};

describe("workoutSetSchema", () => {
  it("accepts a rep-based or a duration-based set", async () => {
    expect(await workoutSetSchema.isValid(validSet)).toBe(true);
    expect(await workoutSetSchema.isValid({ exerciseId: 3, durationSecs: 60 })).toBe(true);
  });

  it.each([
    ["no reps or duration", { exerciseId: 1 }],
    ["zero reps", { exerciseId: 1, reps: 0 }],
    ["negative reps", { exerciseId: 1, reps: -3 }],
    ["zero duration", { exerciseId: 1, durationSecs: 0 }],
    ["null metrics", { exerciseId: 1, reps: null, durationSecs: null }],
  ])("rejects %s", async (_label, set) => {
    await expect(workoutSetSchema.validate(set)).rejects.toThrow(
      "You must provide either 'reps' or 'duration'",
    );
  });

  it("requires an exercise", async () => {
    expect(await workoutSetSchema.isValid({ reps: 5 })).toBe(false);
  });
});

describe("workoutSchema", () => {
  it("accepts a complete workout", async () => {
    expect(await workoutSchema.isValid(validWorkout)).toBe(true);
  });

  it("rejects an empty workout", async () => {
    await expect(workoutSchema.validate({ ...validWorkout, sets: [] })).rejects.toThrow(
      "A workout must contain at least one set.",
    );
  });

  it("rejects a negative duration but allows zero", async () => {
    await expect(workoutSchema.validate({ ...validWorkout, duration: -1 })).rejects.toThrow(
      "Duration cannot be negative",
    );
    expect(await workoutSchema.isValid({ ...validWorkout, duration: 0 })).toBe(true);
  });

  it("requires a valid completion date", async () => {
    expect(await workoutSchema.isValid({ ...validWorkout, completedAt: undefined })).toBe(false);
    expect(await workoutSchema.isValid({ ...validWorkout, completedAt: "not a date" })).toBe(false);
  });

  it("rejects a workout containing an invalid set", async () => {
    expect(
      await workoutSchema.isValid({ ...validWorkout, sets: [validSet, { exerciseId: 1 }] }),
    ).toBe(false);
  });
});
