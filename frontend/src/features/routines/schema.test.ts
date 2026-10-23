import { describe, expect, it } from "vitest";
import { routineSchema } from "./schema";

const item = { exerciseId: 1, targetSets: 3, targetReps: 10, order: 0 };
const routine = { name: "Push day", day: 0, startTime: "18:30", routineItems: [item] };

describe("routineSchema", () => {
  it("accepts a valid routine", async () => {
    expect(await routineSchema.isValid(routine)).toBe(true);
  });

  it("requires a name", async () => {
    expect(await routineSchema.isValid({ ...routine, name: "" })).toBe(false);
  });

  it.each(["24:00", "9:30", "18:60", "1830", "", "ab:cd"])(
    "rejects start time %j",
    async (startTime) => {
      expect(await routineSchema.isValid({ ...routine, startTime })).toBe(false);
    },
  );

  it.each(["00:00", "09:05", "23:59"])("accepts start time %s", async (startTime) => {
    expect(await routineSchema.isValid({ ...routine, startTime })).toBe(true);
  });

  it("requires at least one exercise", async () => {
    await expect(routineSchema.validate({ ...routine, routineItems: [] })).rejects.toThrow(
      "You must add at least one exercise to your routine",
    );
  });

  it("requires at least one target set per exercise", async () => {
    expect(
      await routineSchema.isValid({
        ...routine,
        routineItems: [{ ...item, targetSets: 0 }],
      }),
    ).toBe(false);
  });

  it("requires reps or a duration target", async () => {
    expect(
      await routineSchema.isValid({
        ...routine,
        routineItems: [{ ...item, targetReps: 0 }],
      }),
    ).toBe(false);
    expect(
      await routineSchema.isValid({
        ...routine,
        routineItems: [{ ...item, targetReps: 0, targetDuration: 600 }],
      }),
    ).toBe(true);
  });
});
