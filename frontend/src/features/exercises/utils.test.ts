import { describe, expect, it } from "vitest";
import { benchPress, plank, pushUp, running, squat } from "@/tests/factories";
import {
  getEstimatedOneRepMax,
  getMuscleMapData,
  isCardioExercise,
  isDurationExercise,
  isRepsExercise,
  isWeightsExercise,
} from "./utils";

describe("exercise type predicates", () => {
  it("classifies each metric type", () => {
    expect([benchPress, pushUp, plank, running].map(isRepsExercise)).toEqual([
      true,
      true,
      false,
      false,
    ]);
    expect([benchPress, pushUp, plank, running].map(isWeightsExercise)).toEqual(
      [true, false, false, false],
    );
    expect(
      [benchPress, pushUp, plank, running].map(isDurationExercise),
    ).toEqual([false, false, true, true]);
    expect([benchPress, pushUp, plank, running].map(isCardioExercise)).toEqual([
      false,
      false,
      false,
      true,
    ]);
  });
});

describe("getEstimatedOneRepMax", () => {
  it("uses Epley on the best working set", () => {
    expect(
      getEstimatedOneRepMax([
        { weight: 100, reps: 5 },
        { weight: 110, reps: 1 },
        { weight: 120, reps: 5, setType: "warmup" },
      ]),
    ).toBeCloseTo(116.67, 2);
  });

  it("is 0 with no weighted sets", () => {
    expect(getEstimatedOneRepMax([])).toBe(0);
    expect(getEstimatedOneRepMax([{ weight: null, reps: 10 }])).toBe(0);
  });
});

describe("getMuscleMapData", () => {
  it("weights primary muscles above secondary and sums across exercises", () => {
    const data = getMuscleMapData([benchPress, squat]);
    const bySlug = Object.fromEntries(data.map((d) => [d.slug, d.intensity]));
    expect(bySlug).toEqual({ chest: 5, triceps: 4, quadriceps: 5, gluteal: 4 });
  });
});
