import { describe, expect, it } from "vitest";
import { benchPress, makeRoutineItem, pushUp, squat } from "@/tests/factories";
import {
  diffRoutine,
  formatTarget,
  getDayStr,
  hasRoutineDiff,
  reorderRoutineItems,
  toggleSupersetLink,
  toLocalSchedule,
  toUtcSchedule,
} from "./utils";

// Tests run in Asia/Kolkata (UTC+05:30), see vitest.config.mts.
describe("routine schedule timezones", () => {
  it("converts a local day and time to UTC", () => {
    expect(toUtcSchedule(2, "18:30")).toEqual({
      day: 2,
      startTime: "13:00:00Z",
    });
  });

  it("wraps to the previous day, and from Monday back to Sunday", () => {
    expect(toUtcSchedule(3, "02:00")).toEqual({
      day: 2,
      startTime: "20:30:00Z",
    });
    expect(toUtcSchedule(0, "05:00")).toEqual({
      day: 6,
      startTime: "23:30:00Z",
    });
  });

  it("converts UTC back to local, wrapping Sunday into Monday", () => {
    expect(toLocalSchedule(6, "23:30:00Z")).toEqual({ day: 0, time: "05:00" });
  });

  it("round-trips a local day and time", () => {
    const utc = toUtcSchedule(6, "23:59");
    expect(toLocalSchedule(utc.day, utc.startTime)).toEqual({
      day: 6,
      time: "23:59",
    });
  });

  it("names days Monday-first", () => {
    expect(getDayStr(0)).toBe("Monday");
    expect(getDayStr(6)).toBe("Sunday");
    expect(getDayStr(7)).toBeUndefined();
  });
});

describe("toggleSupersetLink", () => {
  it.each<[string, (number | null)[], number, (number | null)[]]>([
    ["links two unlinked exercises", [null, null, null], 0, [1, 1, null]],
    ["adds the next exercise to the current group", [1, 1, null], 1, [1, 1, 1]],
    ["pulls the next exercise's whole group in", [null, 2, 2], 0, [2, 2, 2]],
    ["merges two groups", [1, 1, 2, 2], 1, [1, 1, 1, 1]],
    ["unlinks a pair, clearing both", [1, 1, null], 0, [null, null, null]],
    [
      "splits a group of three, keeping the tail pair",
      [1, 1, 1],
      0,
      [null, 2, 2],
    ],
    ["splits a group of three at the end", [1, 1, 1], 1, [1, 1, null]],
    ["ignores the last index", [null, null], 1, [null, null]],
  ])("%s", (_, groups, index, expected) => {
    expect(toggleSupersetLink(groups, index)).toEqual(expected);
  });

  it("treats undefined groups as unlinked", () => {
    expect(toggleSupersetLink([undefined, undefined], 0)).toEqual([1, 1]);
  });
});

describe("diffRoutine", () => {
  const items = [
    makeRoutineItem(benchPress, { targetSets: 3 }),
    makeRoutineItem(pushUp, { targetSets: 3 }),
  ];

  it("reports added, removed and changed exercises", () => {
    const diff = diffRoutine(items, [
      { exerciseId: benchPress.id, name: "Bench Press", sets: 4 },
      { exerciseId: squat.id, name: "Squat", sets: 3 },
    ]);

    expect(diff).toEqual({
      added: [{ exerciseId: squat.id, name: "Squat", sets: 3 }],
      removed: [{ exerciseId: pushUp.id, name: "Push Up" }],
      changed: [
        { exerciseId: benchPress.id, name: "Bench Press", from: 3, to: 4 },
      ],
    });
    expect(hasRoutineDiff(diff)).toBe(true);
  });

  it("finds no difference when the routine was followed", () => {
    const diff = diffRoutine(items, [
      { exerciseId: benchPress.id, name: "Bench Press", sets: 3 },
      { exerciseId: pushUp.id, name: "Push Up", sets: 3 },
    ]);
    expect(hasRoutineDiff(diff)).toBe(false);
  });
});

describe("reorderRoutineItems", () => {
  const item = (exerciseId: number, supersetGroup: number | null) => ({
    exerciseId,
    supersetGroup,
  });
  const groupsOf = (items: { supersetGroup: number | null }[]) =>
    items.map((i) => i.supersetGroup);

  it("moves the item to its new position", () => {
    const items = [item(1, null), item(2, null), item(3, null)];

    const reordered = reorderRoutineItems(items, 0, 2);

    expect(reordered.map((i) => i.exerciseId)).toEqual([2, 3, 1]);
  });

  it("keeps a superset whose members are still next to each other", () => {
    const items = [item(1, 1), item(2, 1), item(3, null)];

    expect(groupsOf(reorderRoutineItems(items, 2, 0))).toEqual([null, 1, 1]);
  });

  it("clears a superset when a member is moved away from its partner", () => {
    const items = [item(1, 1), item(2, 1), item(3, null)];

    expect(groupsOf(reorderRoutineItems(items, 0, 2))).toEqual([
      null,
      null,
      null,
    ]);
  });

  it("clears a member left next to a different group", () => {
    const items = [item(1, 2), item(2, 1), item(3, 1)];

    expect(groupsOf(reorderRoutineItems(items, 0, 0))).toEqual([null, 1, 1]);
  });
});

describe("formatTarget", () => {
  const base = {
    targetSets: 3,
    targetReps: null,
    targetWeight: null,
    targetDurationSecs: null,
    targetDistanceMeters: null,
  };

  it("shows sets, reps and the weight in the user's unit", () => {
    const target = { ...base, targetReps: 10, targetWeight: 40 };
    expect(formatTarget(target, "kg")).toBe("3 x 10 @ 40 kg");
    expect(formatTarget(target, "lb")).toBe("3 x 10 @ 88.2 lb");
  });

  it("leaves the weight out when there is none", () => {
    expect(formatTarget({ ...base, targetReps: 12 }, "kg")).toBe("3 x 12");
  });

  it("shows a timed hold as sets of minutes and seconds", () => {
    expect(formatTarget({ ...base, targetDurationSecs: 45 }, "kg")).toBe(
      "3 x 00:45",
    );
  });

  it("shows distance work as the distance and the time", () => {
    const run = {
      ...base,
      targetDurationSecs: 720,
      targetDistanceMeters: 2000,
    };
    expect(formatTarget(run, "kg")).toBe("2 km in 12:00");
    expect(formatTarget({ ...run, targetDistanceMeters: 800 }, "kg")).toBe(
      "800 m in 12:00",
    );
  });
});
