import { describe, expect, it } from "vitest";
import {
  benchPress,
  makeActiveExercise,
  makeWorkout,
  makeWorkoutSet,
  plank,
  pushUp,
  running,
  squat,
} from "@/tests/factories";
import {
  getDefaultSets,
  getEstimatedOneRepMax,
  getNewSet,
  getOrdinalSuffix,
  getSetVolume,
  getTime,
  getTotalTime,
  getTotalVolume,
  getTotalWorkoutsVolume,
  getVolume,
  getWorkoutDistance,
  getWorkoutDuration,
  getWorkoutPace,
  getWorkoutReps,
  getWorkoutVolume,
  isExerciseCompleted,
  isWorkoutCompleted,
} from "./utils";

describe("training volume", () => {
  it("sums weight x reps for weighted exercises only", () => {
    const sets = [
      makeWorkoutSet(benchPress, { weight: 100, reps: 5 }),
      makeWorkoutSet(benchPress, { weight: 80, reps: 10 }),
      makeWorkoutSet(pushUp, { reps: 20 }),
      makeWorkoutSet(plank, { durationSecs: 60 }),
    ];

    expect(getWorkoutVolume(sets)).toBe(100 * 5 + 80 * 10);
  });

  it("is zero for an empty workout", () => {
    expect(getWorkoutVolume([])).toBe(0);
    expect(getTotalWorkoutsVolume([])).toBe(0);
    expect(getTotalVolume([])).toBe(0);
  });

  it("totals volume across workouts", () => {
    const workouts = [
      makeWorkout([makeWorkoutSet(benchPress, { weight: 50, reps: 10 })]),
      makeWorkout([makeWorkoutSet(benchPress, { weight: 60, reps: 5 })]),
    ];

    expect(getTotalWorkoutsVolume(workouts)).toBe(500 + 300);
  });

  it("totals active-session volume, ignoring non-weighted exercises", () => {
    const exercises = [
      makeActiveExercise(benchPress, [
        { exerciseId: 1, setIndex: 1, weight: 40, reps: 10 },
        { exerciseId: 1, setIndex: 2, weight: 40, reps: 8 },
      ]),
      makeActiveExercise(pushUp, [{ exerciseId: 2, setIndex: 1, reps: 30 }]),
    ];

    expect(getTotalVolume(exercises)).toBe(40 * 10 + 40 * 8);
  });

  it("formats per-exercise volume by metric type", () => {
    const weighted = makeActiveExercise(benchPress, [
      { exerciseId: 1, setIndex: 1, weight: 50, reps: 4 },
    ]);
    const bodyweight = makeActiveExercise(pushUp, [
      { exerciseId: 2, setIndex: 1, reps: 12 },
      { exerciseId: 2, setIndex: 2, reps: 8 },
    ]);
    const timed = makeActiveExercise(plank, [
      { exerciseId: 3, setIndex: 1, durationSecs: 45 },
      { exerciseId: 3, setIndex: 2, durationSecs: 45 },
    ]);

    expect(getVolume(weighted)).toBe("200 kg");
    expect(getVolume(bodyweight)).toBe("20 reps");
    expect(getVolume(timed)).toBe("01:30 mins");
  });

  it("describes a single set by metric type", () => {
    expect(getSetVolume(benchPress, { exerciseId: 1, setIndex: 1, reps: 5, weight: 100 })).toBe(
      "5 x 100 kg",
    );
    expect(getSetVolume(pushUp, { exerciseId: 2, setIndex: 1, reps: 15 })).toBe("15 reps");
    expect(getSetVolume(plank, { exerciseId: 3, setIndex: 1, durationSecs: 90 })).toBe(
      "01:30 mins",
    );
    expect(
      getSetVolume(running, {
        exerciseId: 4,
        setIndex: 1,
        distanceMeters: 5000,
        durationSecs: 1500,
      }),
    ).toBe("5000m in 25:00 mins");
  });
});

describe("estimated one-rep max (Epley)", () => {
  it("applies weight * (1 + reps / 30)", () => {
    expect(getEstimatedOneRepMax([{ weight: 100, reps: 5 }])).toBe(117);
    expect(getEstimatedOneRepMax([{ weight: 60, reps: 30 }])).toBe(120);
  });

  it("uses the best set, not the heaviest or the highest-rep set", () => {
    const sets = [
      { weight: 100, reps: 1 }, // 103.3
      { weight: 80, reps: 12 }, // 112
      { weight: 60, reps: 20 }, // 100
    ];

    expect(getEstimatedOneRepMax(sets)).toBe(112);
  });

  it("is zero for no sets or sets without a weight", () => {
    expect(getEstimatedOneRepMax([])).toBe(0);
    expect(getEstimatedOneRepMax([{ reps: 20 }])).toBe(0);
    expect(getEstimatedOneRepMax([{ weight: null, reps: null }])).toBe(0);
  });
});

describe("duration, reps, distance and pace", () => {
  it("sums reps for rep-based exercises", () => {
    const sets = [
      makeWorkoutSet(pushUp, { reps: 10 }),
      makeWorkoutSet(benchPress, { reps: 5, weight: 60 }),
      makeWorkoutSet(plank, { durationSecs: 60 }),
    ];

    expect(getWorkoutReps(sets)).toBe(15);
  });

  it("returns duration in minutes for timed exercises", () => {
    const sets = [
      makeWorkoutSet(plank, { durationSecs: 90 }),
      makeWorkoutSet(running, { durationSecs: 150, distanceMeters: 500 }),
      makeWorkoutSet(pushUp, { reps: 10 }),
    ];

    expect(getWorkoutDuration(sets)).toBe(4);
  });

  it("sums distance for cardio only", () => {
    const sets = [
      makeWorkoutSet(running, { durationSecs: 300, distanceMeters: 1000 }),
      makeWorkoutSet(running, { durationSecs: 300, distanceMeters: 1500 }),
      makeWorkoutSet(plank, { durationSecs: 60 }),
    ];

    expect(getWorkoutDistance(sets)).toBe(2500);
  });

  it("computes pace in minutes per km across cardio sets", () => {
    const sets = [
      makeWorkoutSet(running, { durationSecs: 300, distanceMeters: 1000 }),
      makeWorkoutSet(running, { durationSecs: 600, distanceMeters: 1000 }),
    ];

    expect(getWorkoutPace(sets)).toBeCloseTo(7.5);
  });

  it("returns pace 0 without usable cardio sets", () => {
    expect(getWorkoutPace([])).toBe(0);
    expect(getWorkoutPace([makeWorkoutSet(plank, { durationSecs: 60 })])).toBe(0);
    expect(
      getWorkoutPace([makeWorkoutSet(running, { durationSecs: 60, distanceMeters: 0 })]),
    ).toBe(0);
  });

  it("rounds total workout time up to whole minutes", () => {
    const workouts = [
      makeWorkout([], { duration: 61 }),
      makeWorkout([], { duration: 60 }),
    ];

    expect(getTotalTime(workouts)).toBe(3);
    expect(getTotalTime([])).toBe(0);
  });
});

describe("getTime", () => {
  it.each([
    [0, "00:00"],
    [5, "00:05"],
    [65, "01:05"],
    [600, "10:00"],
    [3599, "59:59"],
  ])("formats %i seconds as %s", (secs, expected) => {
    expect(getTime(secs)).toBe(expected);
  });
});

describe("default sets", () => {
  it("builds three sets with sensible defaults per metric type", () => {
    const weighted = getDefaultSets(benchPress);
    expect(weighted).toHaveLength(3);
    expect(weighted.map((s) => s.setIndex)).toEqual([1, 2, 3]);
    expect(weighted[0]).toMatchObject({
      exerciseId: benchPress.id,
      reps: 10,
      weight: 25,
      isCompleted: false,
    });
    expect(weighted[0].durationSecs).toBeUndefined();

    expect(getDefaultSets(plank)[0]).toMatchObject({ durationSecs: 600 });
    expect(getDefaultSets(running)[0]).toMatchObject({
      durationSecs: 600,
      distanceMeters: 500,
    });
    expect(getDefaultSets(pushUp)[0].weight).toBeUndefined();
  });

  it("keeps the logged sets when replacing an exercise with a similar one, but re-targets them", () => {
    const logged = makeActiveExercise(benchPress, [
      { exerciseId: benchPress.id, setIndex: 1, reps: 8, weight: 60, isCompleted: true },
    ]);

    const sets = getDefaultSets(squat, logged);

    expect(sets).toEqual([
      { exerciseId: squat.id, setIndex: 1, reps: 8, weight: 60, isCompleted: true },
    ]);
  });

  it("starts fresh defaults when replacing with an exercise that tracks different metrics", () => {
    const logged = makeActiveExercise(benchPress, [
      { exerciseId: benchPress.id, setIndex: 1, reps: 8, weight: 60, isCompleted: true },
    ]);

    const sets = getDefaultSets(plank, logged);

    expect(sets).toHaveLength(3);
    expect(sets.every((s) => s.exerciseId === plank.id && !s.isCompleted)).toBe(true);
  });

  it("numbers a new set after the existing ones", () => {
    const exercise = makeActiveExercise(benchPress, getDefaultSets(benchPress));

    expect(getNewSet(exercise).setIndex).toBe(4);
    expect(
      getNewSet(exercise, {
        exerciseId: benchPress.id,
        targetReps: 6,
      } as Parameters<typeof getNewSet>[1]),
    ).toMatchObject({ reps: 6, setIndex: 4 });
  });
});

describe("completion", () => {
  const done = { exerciseId: 1, setIndex: 1, reps: 5, isCompleted: true };
  const pending = { exerciseId: 1, setIndex: 2, reps: 5, isCompleted: false };

  it("treats an exercise as completed only when every set is", () => {
    expect(isExerciseCompleted(makeActiveExercise(benchPress, [done, done]))).toBe(true);
    expect(isExerciseCompleted(makeActiveExercise(benchPress, [done, pending]))).toBe(false);
  });

  it("treats a workout as completed only when every exercise is", () => {
    const finished = makeActiveExercise(benchPress, [done]);
    const unfinished = makeActiveExercise(pushUp, [pending]);

    expect(isWorkoutCompleted([finished])).toBe(true);
    expect(isWorkoutCompleted([finished, unfinished])).toBe(false);
  });
});

describe("getOrdinalSuffix", () => {
  it.each([
    [1, "st"],
    [2, "nd"],
    [3, "rd"],
    [4, "th"],
    [10, "th"],
    [11, "th"],
    [12, "th"],
    [13, "th"],
    [21, "st"],
    [22, "nd"],
    [23, "rd"],
    [101, "st"],
    [111, "th"],
    [112, "th"],
    [113, "th"],
  ])("suffix for %i is %s", (n, suffix) => {
    expect(getOrdinalSuffix(n)).toBe(suffix);
  });
});
