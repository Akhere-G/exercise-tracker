import { describe, expect, it } from "vitest";
import { routineItemSchema, routineSchema } from "./schema";

const item = (overrides: Record<string, unknown> = {}) => ({
  exerciseId: 1,
  targetSets: 3,
  targetReps: 10,
  order: 0,
  ...overrides,
});

const errorsFor = (schema: typeof routineItemSchema, value: unknown) => {
  try {
    schema.validateSync(value, { abortEarly: false });
    return [];
  } catch (err) {
    return (err as { inner: { path: string }[] }).inner.map((e) => e.path);
  }
};

describe("routineItemSchema", () => {
  it("flags both fields when neither reps nor duration is set", () => {
    expect(
      errorsFor(
        routineItemSchema,
        item({ targetReps: null, targetDuration: null }),
      ),
    ).toEqual(expect.arrayContaining(["targetReps", "targetDuration"]));
  });

  it("treats an empty rest field as 'use the default' and caps it at an hour", () => {
    expect(
      routineItemSchema.validateSync(item({ restSecs: "" })).restSecs,
    ).toBeNull();
    expect(routineItemSchema.isValidSync(item({ restSecs: 3601 }))).toBe(false);
  });
});

describe("routineSchema", () => {
  const routine = (overrides: Record<string, unknown> = {}) => ({
    name: "Push day",
    day: 0,
    startTime: "18:30",
    routineItems: [item()],
    ...overrides,
  });

  it("accepts a valid start time and rejects an impossible one", () => {
    expect(routineSchema.isValidSync(routine({ startTime: "09:05" }))).toBe(
      true,
    );
    expect(routineSchema.isValidSync(routine({ startTime: "24:00" }))).toBe(
      false,
    );
  });
});
