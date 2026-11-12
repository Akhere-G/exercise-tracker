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
  it("accepts reps-based and duration-based items", () => {
    expect(routineItemSchema.isValidSync(item())).toBe(true);
    expect(
      routineItemSchema.isValidSync(
        item({ targetReps: null, targetDuration: 45 }),
      ),
    ).toBe(true);
  });

  it("flags both fields when neither reps nor duration is set", () => {
    expect(
      errorsFor(
        routineItemSchema,
        item({ targetReps: null, targetDuration: null }),
      ),
    ).toEqual(expect.arrayContaining(["targetReps", "targetDuration"]));
  });

  it("requires at least one set", () => {
    expect(errorsFor(routineItemSchema, item({ targetSets: 0 }))).toContain(
      "targetSets",
    );
  });

  it("treats an empty rest field as 'use the default' and bounds it to an hour", () => {
    expect(
      routineItemSchema.validateSync(item({ restSecs: "" })).restSecs,
    ).toBeNull();
    expect(routineItemSchema.isValidSync(item({ restSecs: 3600 }))).toBe(true);
    expect(routineItemSchema.isValidSync(item({ restSecs: 3601 }))).toBe(false);
    expect(routineItemSchema.isValidSync(item({ restSecs: -1 }))).toBe(false);
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

  it("accepts a complete routine", () => {
    expect(routineSchema.isValidSync(routine())).toBe(true);
  });

  it("requires at least one exercise", async () => {
    await expect(
      routineSchema.validate(routine({ routineItems: [] })),
    ).rejects.toThrow("You must add at least one exercise to your routine");
  });

  it.each(["24:00", "9:30", "18:60", "abc"])(
    "rejects start time %s",
    (startTime) => {
      expect(routineSchema.isValidSync(routine({ startTime }))).toBe(false);
    },
  );

  it.each(["00:00", "09:05", "23:59"])("accepts start time %s", (startTime) => {
    expect(routineSchema.isValidSync(routine({ startTime }))).toBe(true);
  });
});
