import { describe, expect, it } from "vitest";
import { buildRoutineSchema } from "./schema";

const request = {
  goal: "hypertrophy",
  equipment: ["dumbbells"],
  minutes: 45,
  daysPerWeek: 3,
};

describe("buildRoutineSchema", () => {
  it("accepts a valid request", () => {
    expect(buildRoutineSchema.isValidSync(request)).toBe(true);
  });

  it.each([
    [{ equipment: [] }, "Choose at least one kind of equipment"],
    [{ minutes: 14 }, "At least 15 minutes"],
    [{ minutes: 181 }, "At most 180 minutes"],
    [{ daysPerWeek: 8 }, "At most 7 days"],
    [{ minutes: "" }, "Enter how long you have"],
  ])("%o → %s", (overrides, message) => {
    expect(() =>
      buildRoutineSchema.validateSync({ ...request, ...overrides }),
    ).toThrow(message);
  });

  it("rejects unknown equipment and over-long notes", () => {
    expect(
      buildRoutineSchema.isValidSync({ ...request, equipment: ["trampoline"] }),
    ).toBe(false);
    expect(
      buildRoutineSchema.isValidSync({ ...request, notes: "x".repeat(501) }),
    ).toBe(false);
  });
});
