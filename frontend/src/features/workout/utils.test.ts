import { describe, expect, it } from "vitest";
import {
  benchPress,
  makeActiveExercise,
  makePreviousSet,
  makeRoutineItem,
  makeWorkout,
  makeWorkoutSet,
  plank,
  pushUp,
  running,
  squat,
} from "@/tests/factories";
import {
  formatPreviousSet,
  getActiveSupersetGroup,
  getDefaultSets,
  getExercisesFromWorkout,
  getNewSet,
  getOrdinalSuffix,
  getPreviousForSet,
  getSetLabel,
  getSetVolume,
  getTime,
  getTotalTime,
  getTotalVolume,
  getVolume,
  getWorkoutDistance,
  getWorkoutDuration,
  getWorkoutPace,
  getWorkoutReps,
  getWorkoutVolume,
  isWorkoutCompleted,
  linkWithNext,
  nextSetType,
  sameMetrics,
  unlinkSuperset,
} from "./utils";

describe("getDefaultSets", () => {
  it("uses routine targets for reps and the last session for weight", () => {
    const sets = getDefaultSets(benchPress, undefined, {
      routineItem: makeRoutineItem(benchPress, {
        targetSets: 2,
        targetReps: 5,
      }),
      previousSets: [
        makePreviousSet({ exerciseId: 1, reps: 8, weight: 60 }),
        makePreviousSet({ exerciseId: 1, setIndex: 2, reps: 8, weight: 62.5 }),
      ],
    });

    expect(sets).toEqual([
      expect.objectContaining({
        setIndex: 1,
        reps: 5,
        weight: 60,
        isCompleted: false,
      }),
      expect.objectContaining({ setIndex: 2, reps: 5, weight: 62.5 }),
    ]);
  });

  it("repeats the last session's set count and values without a routine", () => {
    const sets = getDefaultSets(benchPress, undefined, {
      previousSets: [
        makePreviousSet({
          exerciseId: 1,
          reps: 10,
          weight: 40,
          setType: "warmup",
        }),
        makePreviousSet({ exerciseId: 1, setIndex: 2, reps: 8, weight: 80 }),
        makePreviousSet({ exerciseId: 1, setIndex: 3, reps: 6, weight: 85 }),
      ],
    });

    // The warm-up is skipped: two working sets, copied in order.
    expect(sets.map((s) => [s.reps, s.weight])).toEqual([
      [8, 80],
      [6, 85],
    ]);
  });

  it("repeats the final previous set when the routine asks for more sets", () => {
    const sets = getDefaultSets(benchPress, undefined, {
      routineItem: makeRoutineItem(benchPress, {
        targetSets: 3,
        targetReps: null,
      }),
      previousSets: [makePreviousSet({ exerciseId: 1, reps: 8, weight: 80 })],
    });

    expect(sets.map((s) => [s.reps, s.weight])).toEqual([
      [8, 80],
      [8, 80],
      [8, 80],
    ]);
  });

  it("falls back to three sets of defaults with no history", () => {
    expect(getDefaultSets(benchPress)).toEqual(
      Array.from({ length: 3 }, (_, i) =>
        expect.objectContaining({ setIndex: i + 1, reps: 10, weight: 25 }),
      ),
    );
  });

  it("only fills the fields each exercise type tracks", () => {
    const [plankSet] = getDefaultSets(plank);
    expect(plankSet).toMatchObject({ durationSecs: 600 });
    expect(plankSet.reps).toBeUndefined();
    expect(plankSet.weight).toBeUndefined();
    expect(plankSet.distanceMeters).toBeUndefined();

    const [runSet] = getDefaultSets(running);
    expect(runSet).toMatchObject({ durationSecs: 600, distanceMeters: 500 });

    const [pushUpSet] = getDefaultSets(pushUp);
    expect(pushUpSet).toMatchObject({ reps: 10 });
    expect(pushUpSet.weight).toBeUndefined();
  });

  it("uses a routine's duration target for timed exercises", () => {
    const [set] = getDefaultSets(plank, undefined, {
      routineItem: makeRoutineItem(plank, {
        targetReps: null,
        targetDurationSecs: 45,
      }),
    });
    expect(set.durationSecs).toBe(45);
  });

  it("keeps the old sets when replacing with the same kind of exercise, re-targeted to the new one", () => {
    const old = makeActiveExercise(benchPress, [
      { reps: 5, weight: 100, isCompleted: true },
      { reps: 5, weight: 100 },
    ]);

    const sets = getDefaultSets(squat, old);

    expect(sets).toHaveLength(2);
    expect(sets.every((s) => s.exerciseId === squat.id)).toBe(true);
    expect(sets[0]).toMatchObject({ reps: 5, weight: 100, isCompleted: true });
  });

  it("builds fresh sets when replacing a bodyweight exercise with a weighted one", () => {
    const old = makeActiveExercise(pushUp, [{ reps: 20 }]);

    const sets = getDefaultSets(benchPress, old);

    expect(sets).toHaveLength(3);
    expect(
      sets.every((s) => s.weight === 25 && s.exerciseId === benchPress.id),
    ).toBe(true);
  });
});

describe("sameMetrics", () => {
  it("matches only identical metric types", () => {
    expect(sameMetrics(benchPress, squat)).toBe(true);
    expect(sameMetrics(benchPress, pushUp)).toBe(false);
    expect(sameMetrics(plank, running)).toBe(false);
  });
});

describe("getNewSet", () => {
  it("copies the last working set already in the workout", () => {
    const exercise = makeActiveExercise(benchPress, [
      { reps: 8, weight: 80 },
      { reps: 12, weight: 40, setType: "drop" },
      { reps: 10, weight: 20, setType: "warmup" },
    ]);

    expect(getNewSet(exercise)).toMatchObject({
      setIndex: 4,
      reps: 12,
      weight: 40,
      isCompleted: false,
    });
  });

  it("falls back to last session then routine targets for an exercise with no sets", () => {
    const exercise = makeActiveExercise(benchPress, []);
    const set = getNewSet(
      exercise,
      makeRoutineItem(benchPress, { targetReps: 6 }),
      [makePreviousSet({ exerciseId: 1, reps: 8, weight: 70 })],
    );

    expect(set).toMatchObject({ setIndex: 1, reps: 6, weight: 70 });
  });
});

describe("getPreviousForSet", () => {
  const previous = [
    makePreviousSet({
      exerciseId: 1,
      setIndex: 1,
      setType: "warmup",
      weight: 40,
    }),
    makePreviousSet({ exerciseId: 1, setIndex: 2, weight: 80 }),
    makePreviousSet({ exerciseId: 1, setIndex: 3, weight: 85 }),
  ];

  it("lines up working sets with working sets even when warm-ups differ", () => {
    const sets = makeActiveExercise(benchPress, [{}, {}]).sets;
    expect(getPreviousForSet(previous, sets, sets[1])?.weight).toBe(85);
  });

  it("lines up warm-ups with warm-ups", () => {
    const sets = makeActiveExercise(benchPress, [
      { setType: "warmup" },
      {},
    ]).sets;
    expect(getPreviousForSet(previous, sets, sets[0])?.weight).toBe(40);
    expect(getPreviousForSet(previous, sets, sets[1])?.weight).toBe(80);
  });

  it("returns nothing past the end of last session", () => {
    const sets = makeActiveExercise(benchPress, [{}, {}, {}]).sets;
    expect(getPreviousForSet(previous, sets, sets[2])).toBeUndefined();
  });
});

describe("set labels and types", () => {
  it("cycles normal → warmup → drop → failure → normal", () => {
    expect(nextSetType()).toBe("warmup");
    expect(nextSetType("warmup")).toBe("drop");
    expect(nextSetType("drop")).toBe("failure");
    expect(nextSetType("failure")).toBe("normal");
  });

  it("numbers normal sets by position and letters special sets", () => {
    const sets = makeActiveExercise(benchPress, [
      { setType: "warmup" },
      {},
      { setType: "drop" },
      {},
      { setType: "failure" },
    ]).sets;

    expect(sets.map((s) => getSetLabel(sets, s))).toEqual([
      "W",
      "1",
      "D",
      "2",
      "F",
    ]);
  });
});

describe("getOrdinalSuffix", () => {
  it.each([
    [1, "st"],
    [2, "nd"],
    [3, "rd"],
    [4, "th"],
    [11, "th"],
    [12, "th"],
    [13, "th"],
    [21, "st"],
    [22, "nd"],
    [101, "st"],
    [111, "th"],
    [112, "th"],
  ])("%i → %s", (n, suffix) => {
    expect(getOrdinalSuffix(n)).toBe(suffix);
  });
});

describe("volume and time for one exercise", () => {
  it("formats weights volume excluding warm-ups, in the user's unit", () => {
    const exercise = makeActiveExercise(benchPress, [
      { reps: 10, weight: 20, setType: "warmup" },
      { reps: 5, weight: 100 },
      { reps: 5, weight: 100 },
    ]);
    expect(getVolume(exercise)).toBe("1,000 kg");
    expect(getVolume(exercise, "lb")).toBe("2,204.6 lb");
  });

  it("excludes warm-ups from rep and duration totals too", () => {
    const pushUps = makeActiveExercise(pushUp, [
      { reps: 10, setType: "warmup" },
      { reps: 20 },
    ]);
    expect(getVolume(pushUps)).toBe("20 reps");

    const planks = makeActiveExercise(plank, [
      { durationSecs: 30, setType: "warmup" },
      { durationSecs: 90 },
    ]);
    expect(getVolume(planks)).toBe("01:30 mins");
  });

  it("describes a single set for each exercise type", () => {
    expect(
      getSetVolume(benchPress, {
        exerciseId: 1,
        setIndex: 1,
        reps: 5,
        weight: 100,
      }),
    ).toBe("5 x 100 kg");
    expect(getSetVolume(pushUp, { exerciseId: 2, setIndex: 1, reps: 12 })).toBe(
      "12 reps",
    );
    expect(
      getSetVolume(plank, { exerciseId: 3, setIndex: 1, durationSecs: 65 }),
    ).toBe("01:05 mins");
    expect(
      getSetVolume(running, {
        exerciseId: 4,
        setIndex: 1,
        durationSecs: 300,
        distanceMeters: 1000,
      }),
    ).toBe("1000m in 05:00 mins");
  });

  it("totals only weighted working sets across exercises", () => {
    const total = getTotalVolume([
      makeActiveExercise(benchPress, [
        { reps: 5, weight: 100 },
        { reps: 10, weight: 20, setType: "warmup" },
      ]),
      makeActiveExercise(squat, [{ reps: 3, weight: 140 }]),
      makeActiveExercise(pushUp, [{ reps: 50 }]),
    ]);
    expect(total).toBe(500 + 420);
  });

  it("formats times as MM:SS, allowing long durations", () => {
    expect(getTime(0)).toBe("00:00");
    expect(getTime(59)).toBe("00:59");
    expect(getTime(61)).toBe("01:01");
    expect(getTime(6000)).toBe("100:00");
  });

  it("formats a previous set compactly in the user's unit", () => {
    expect(formatPreviousSet(benchPress, { reps: 5, weight: 100 }, "kg")).toBe(
      "100×5",
    );
    expect(formatPreviousSet(benchPress, { reps: 5, weight: 100 }, "lb")).toBe(
      "220.5×5",
    );
    expect(formatPreviousSet(pushUp, { reps: 12 }, "kg")).toBe("12");
    expect(formatPreviousSet(plank, { durationSecs: 45 }, "kg")).toBe("00:45");
    expect(formatPreviousSet(running, { distanceMeters: 800 }, "kg")).toBe(
      "800m",
    );
  });
});

describe("workout aggregates", () => {
  const sets = [
    makeWorkoutSet(benchPress, { id: 1, reps: 5, weight: 100 }),
    makeWorkoutSet(benchPress, {
      id: 2,
      reps: 10,
      weight: 40,
      setType: "warmup",
    }),
    makeWorkoutSet(pushUp, { id: 3, reps: 20 }),
    makeWorkoutSet(plank, { id: 4, durationSecs: 90 }),
    makeWorkoutSet(running, {
      id: 5,
      durationSecs: 1500,
      distanceMeters: 5000,
    }),
  ];

  it("computes volume, reps, duration and distance from the right exercise types", () => {
    expect(getWorkoutVolume(sets)).toBe(500);
    // Reps count every rep-based set, warm-ups included.
    expect(getWorkoutReps(sets)).toBe(5 + 10 + 20);
    expect(getWorkoutDuration(sets)).toBeCloseTo((90 + 1500) / 60);
    expect(getWorkoutDistance(sets)).toBe(5000);
  });

  it("computes pace in minutes per km", () => {
    expect(getWorkoutPace(sets)).toBeCloseTo(5);
  });

  it("returns a pace of 0 without usable cardio sets", () => {
    expect(getWorkoutPace([])).toBe(0);
    expect(
      getWorkoutPace([
        makeWorkoutSet(running, { durationSecs: 600, distanceMeters: 0 }),
      ]),
    ).toBe(0);
  });

  it("rounds total workout time up to whole minutes", () => {
    expect(
      getTotalTime([
        makeWorkout([], { duration: 61 }),
        makeWorkout([], { duration: 60 }),
      ]),
    ).toBe(3);
    expect(getTotalTime([])).toBe(0);
  });

  it("treats an empty workout as completed and any open set as not", () => {
    expect(isWorkoutCompleted([])).toBe(true);
    expect(
      isWorkoutCompleted([
        makeActiveExercise(benchPress, [
          { isCompleted: true },
          { isCompleted: false },
        ]),
      ]),
    ).toBe(false);
  });
});

describe("supersets", () => {
  const exercises = () => [
    makeActiveExercise(benchPress, [{}]),
    makeActiveExercise(squat, [{}]),
    makeActiveExercise(pushUp, [{}]),
  ];

  it("links an exercise with the next one in a new group", () => {
    const linked = linkWithNext(exercises(), benchPress.id);
    expect(linked.map((e) => e.supersetGroup ?? null)).toEqual([1, 1, null]);
    expect(getActiveSupersetGroup(linked, linked[0])).toBe(1);
  });

  it("extends an existing group instead of creating another", () => {
    const linked = linkWithNext(
      linkWithNext(exercises(), benchPress.id),
      squat.id,
    );
    expect(linked.map((e) => e.supersetGroup)).toEqual([1, 1, 1]);
  });

  it("does nothing for the last exercise or an unknown id", () => {
    const list = exercises();
    expect(linkWithNext(list, pushUp.id)).toBe(list);
    expect(linkWithNext(list, 999)).toBe(list);
  });

  it("a group left with one member is not an active superset", () => {
    const unlinked = unlinkSuperset(
      linkWithNext(exercises(), benchPress.id),
      benchPress.id,
    );
    expect(getActiveSupersetGroup(unlinked, unlinked[1])).toBeNull();
  });
});

describe("getExercisesFromWorkout", () => {
  it("rebuilds exercises in set order with nothing completed", () => {
    const workout = makeWorkout([
      makeWorkoutSet(squat, { id: 12, setIndex: 1, reps: 5, weight: 140 }),
      makeWorkoutSet(benchPress, { id: 10, setIndex: 1, reps: 5, weight: 100 }),
      makeWorkoutSet(benchPress, {
        id: 11,
        setIndex: 2,
        reps: 5,
        weight: 100,
        setType: "drop",
      }),
    ]);

    const exercises = getExercisesFromWorkout(workout);

    expect(exercises.map((e) => e.name)).toEqual(["Bench Press", "Squat"]);
    expect(exercises[0].sets).toEqual([
      expect.objectContaining({
        setIndex: 1,
        reps: 5,
        weight: 100,
        isCompleted: false,
      }),
      expect.objectContaining({ setIndex: 2, setType: "drop" }),
    ]);
  });

  it("keeps supersets with two members and drops lone ones", () => {
    const workout = makeWorkout([
      makeWorkoutSet(benchPress, { id: 1, supersetGroup: 4 }),
      makeWorkoutSet(squat, { id: 2, supersetGroup: 4 }),
      makeWorkoutSet(pushUp, { id: 3, supersetGroup: 9 }),
    ]);

    expect(
      getExercisesFromWorkout(workout).map((e) => e.supersetGroup),
    ).toEqual([4, 4, null]);
  });
});
