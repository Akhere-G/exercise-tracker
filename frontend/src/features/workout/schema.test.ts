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
});

describe("workoutSchema", () => {
  const workout = {
    completedAt: new Date(),
    duration: 600,
    sets: [{ exerciseId: 1, reps: 5 }],
  };

  it("requires at least one set", async () => {
    await expect(
      workoutSchema.validate({ ...workout, sets: [] }),
    ).rejects.toThrow("A workout must contain at least one set.");
  });
});
