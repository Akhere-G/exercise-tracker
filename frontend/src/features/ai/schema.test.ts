import { describe, expect, it } from "vitest";
import { buildRoutineSchema } from "./schema";

const request = {
  goal: "hypertrophy",
  equipment: ["dumbbells"],
  minutes: 45,
  daysPerWeek: 3,
};

describe("buildRoutineSchema", () => {
  it("rejects unknown equipment and over-long notes", () => {
    expect(
      buildRoutineSchema.isValidSync({ ...request, equipment: ["trampoline"] }),
    ).toBe(false);
    expect(
      buildRoutineSchema.isValidSync({ ...request, notes: "x".repeat(501) }),
    ).toBe(false);
  });
});
