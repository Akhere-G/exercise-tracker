import { beforeEach, describe, expect, it } from "vitest";
import { benchPress, makeActiveExercise, pushUp } from "@/tests/factories";
import {
  readStoredWorkout,
  sanitizeStoredWorkout,
  useWorkout,
  workoutStorageKey,
} from "./store";

const initialState = useWorkout.getState();

const validState = {
  routineId: 7,
  routineName: "Push day",
  startedAt: "2025-01-06T10:00:00.000Z",
  duration: null,
  currentExerciseId: benchPress.id,
  exercises: [
    makeActiveExercise(benchPress, [
      { exerciseId: benchPress.id, setIndex: 1, reps: 5, weight: 60, isCompleted: true },
    ]),
  ],
};

function storedJson() {
  return JSON.parse(localStorage.getItem(workoutStorageKey) ?? "null");
}

beforeEach(() => {
  useWorkout.setState({ ...initialState }, true);
  localStorage.clear();
});

describe("useWorkout persistence", () => {
  it("writes the session to localStorage after every change", () => {
    const { setWorkoutData } = useWorkout.getState();

    setWorkoutData({ routineName: "Legs", exercises: [makeActiveExercise(pushUp, [])] });
    expect(storedJson().state).toMatchObject({ routineName: "Legs" });

    setWorkoutData({ currentExerciseId: pushUp.id });
    expect(storedJson().state.currentExerciseId).toBe(pushUp.id);
  });

  it("addSet appends to the current exercise only", () => {
    const { setWorkoutData, addSet } = useWorkout.getState();
    setWorkoutData({
      currentExerciseId: benchPress.id,
      exercises: [makeActiveExercise(benchPress, []), makeActiveExercise(pushUp, [])],
    });

    addSet({ exerciseId: benchPress.id, setIndex: 1, reps: 5 });

    const [bench, push] = useWorkout.getState().exercises;
    expect(bench.sets).toHaveLength(1);
    expect(push.sets).toHaveLength(0);
    expect(storedJson().state.exercises[0].sets).toHaveLength(1);
  });

  it("resetState returns to an empty workout", () => {
    useWorkout.getState().setWorkoutData(validState as never);

    useWorkout.getState().resetState();

    expect(useWorkout.getState()).toMatchObject({
      routineId: null,
      startedAt: null,
      exercises: [],
      currentExerciseId: 0,
    });
  });

  it("restores a saved session on rehydrate, reviving the start time as a Date", async () => {
    localStorage.setItem(workoutStorageKey, JSON.stringify({ state: validState, version: 0 }));

    await useWorkout.persist.rehydrate();

    const state = useWorkout.getState();
    expect(state.routineName).toBe("Push day");
    expect(state.exercises[0].sets[0].isCompleted).toBe(true);
    expect(state.startedAt).toBeInstanceOf(Date);
    expect(state.startedAt?.toISOString()).toBe("2025-01-06T10:00:00.000Z");
  });

  it.each([
    ["exercises of the wrong type", { exercises: "oops" }],
    ["an exercise without sets", { exercises: [{ id: 1 }] }],
    ["a non-object", "oops"],
  ])("ignores corrupt saved state: %s", async (_label, state) => {
    localStorage.setItem(workoutStorageKey, JSON.stringify({ state, version: 0 }));

    await useWorkout.persist.rehydrate();

    expect(useWorkout.getState().exercises).toEqual([]);
    expect(useWorkout.getState().routineName).toBeNull();
  });

  it("survives unparseable storage contents", async () => {
    localStorage.setItem(workoutStorageKey, "{definitely not json");

    await expect(useWorkout.persist.rehydrate()).resolves.not.toThrow();
    expect(useWorkout.getState().exercises).toEqual([]);
  });
});

describe("sanitizeStoredWorkout", () => {
  it("keeps a valid session", () => {
    expect(sanitizeStoredWorkout(validState)).toMatchObject({
      routineId: 7,
      routineName: "Push day",
      currentExerciseId: benchPress.id,
    });
  });

  it("repairs fields it can and drops the rest", () => {
    const result = sanitizeStoredWorkout({
      ...validState,
      routineId: "7",
      routineName: 5,
      duration: "long",
      currentExerciseId: 999,
    });

    expect(result).toMatchObject({
      routineId: null,
      routineName: null,
      duration: null,
      currentExerciseId: benchPress.id,
    });
  });

  it("treats an unparseable start time as missing", () => {
    expect(sanitizeStoredWorkout({ ...validState, startedAt: "yesterday-ish" })?.startedAt).toBeNull();
  });

  it.each([
    ["null", null],
    ["an array", []],
    ["an empty object", {}],
    ["a never-started, empty workout", { exercises: [], startedAt: null }],
  ])("returns null for %s", (_label, value) => {
    expect(sanitizeStoredWorkout(value)).toBeNull();
  });

  it("keeps a started workout that has no exercises yet", () => {
    expect(
      sanitizeStoredWorkout({ exercises: [], startedAt: "2025-01-06T10:00:00.000Z" }),
    ).toMatchObject({ exercises: [], currentExerciseId: 0 });
  });
});

describe("readStoredWorkout", () => {
  it("returns null when nothing or garbage is stored", () => {
    expect(readStoredWorkout()).toBeNull();
    localStorage.setItem(workoutStorageKey, "{nope");
    expect(readStoredWorkout()).toBeNull();
    localStorage.setItem(workoutStorageKey, JSON.stringify({ state: null }));
    expect(readStoredWorkout()).toBeNull();
  });

  it("returns the validated state", () => {
    localStorage.setItem(workoutStorageKey, JSON.stringify({ state: validState, version: 0 }));

    expect(readStoredWorkout()?.routineName).toBe("Push day");
  });
});
