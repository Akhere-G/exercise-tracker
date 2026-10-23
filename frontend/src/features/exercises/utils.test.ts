import { describe, expect, it } from "vitest";
import { benchPress, makeExercise, plank, pushUp, running } from "@/tests/factories";
import { MetricsType } from "./schemas";
import {
  getMuscleMapData,
  isCardioExercise,
  isDurationExercise,
  isRepsExercise,
  isWeightsExercise,
} from "./utils";

describe("metric predicates", () => {
  it.each([
    ["reps+weight", benchPress, { reps: true, weights: true, duration: false, cardio: false }],
    ["reps", pushUp, { reps: true, weights: false, duration: false, cardio: false }],
    ["duration", plank, { reps: false, weights: false, duration: true, cardio: false }],
    ["duration+distance", running, { reps: false, weights: false, duration: true, cardio: true }],
  ])("classifies %s exercises", (_label, exercise, expected) => {
    expect(isRepsExercise(exercise)).toBe(expected.reps);
    expect(isWeightsExercise(exercise)).toBe(expected.weights);
    expect(isDurationExercise(exercise)).toBe(expected.duration);
    expect(isCardioExercise(exercise)).toBe(expected.cardio);
  });
});

describe("getMuscleMapData", () => {
  it("weights primary muscles above secondary ones and merges aliases", () => {
    const exercises = [
      makeExercise({
        id: 10,
        metrics: MetricsType.REPS_WEIGHT,
        muscles: [
          { name: "Chest", contributionType: "primary" },
          { name: "Triceps", contributionType: "secondary" },
        ],
      }),
      makeExercise({
        id: 11,
        metrics: MetricsType.REPS_WEIGHT,
        muscles: [
          { name: "upper chest", contributionType: "primary" },
          { name: "Not A Muscle", contributionType: "primary" },
        ],
      }),
    ];

    const data = getMuscleMapData(exercises);
    const bySlug = Object.fromEntries(data.map((d) => [d.slug, d.intensity]));

    expect(bySlug).toEqual({ chest: 10, triceps: 4 });
  });

  it("returns nothing for no exercises", () => {
    expect(getMuscleMapData([])).toEqual([]);
  });
});
