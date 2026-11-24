import { describe, expect, it } from "vitest";
import { onboardingSchema } from "./schema";

const answers = {
  goal: "strength",
  experience: "beginner",
  workoutsPerWeek: 3,
  weightUnit: "lb",
  sex: "unspecified",
  bodyWeightKg: null,
  coachPersona: "hype",
  timezone: "Europe/London",
};

describe("onboardingSchema", () => {
  it("accepts a complete set of answers, with body weight optional", () => {
    expect(onboardingSchema.isValidSync(answers)).toBe(true);
    expect(onboardingSchema.isValidSync({ ...answers, bodyWeightKg: 82 })).toBe(
      true,
    );
  });
});
