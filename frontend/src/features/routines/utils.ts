import { moveItem } from "@/src/lib/reorder";
import { formatWeight, WeightUnit } from "@/src/lib/units";

export const getDayStr = (day: number) => {
  switch (day) {
    case 0:
      return "Monday";
    case 1:
      return "Tuesday";
    case 2:
      return "Wednesday";
    case 3:
      return "Thursday";
    case 4:
      return "Friday";
    case 5:
      return "Saturday";
    case 6:
      return "Sunday";
  }
};

const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY;

const pad = (value: number) => value.toString().padStart(2, "0");

const shiftWeekTime = (day: number, time: string, offsetMinutes: number) => {
  const [hours, minutes] = time.split(":").slice(0, 2).map(Number);
  const total =
    (((day * MINUTES_PER_DAY + hours * 60 + minutes + offsetMinutes) %
      MINUTES_PER_WEEK) +
      MINUTES_PER_WEEK) %
    MINUTES_PER_WEEK;
  const minuteOfDay = total % MINUTES_PER_DAY;

  return {
    day: Math.floor(total / MINUTES_PER_DAY),
    time: `${pad(Math.floor(minuteOfDay / 60))}:${pad(minuteOfDay % 60)}`,
  };
};

export const toUtcSchedule = (day: number, time: string) => {
  const utc = shiftWeekTime(day, time, new Date().getTimezoneOffset());
  return { day: utc.day, startTime: `${utc.time}:00Z` };
};

export const toLocalSchedule = (day: number, startTime: string) =>
  shiftWeekTime(day, startTime, -new Date().getTimezoneOffset());

type SupersetGroups = (number | null | undefined)[];

/**
 * Links the exercise at `index` with the next one, or unlinks them when they
 * are already linked. Exercises that end up alone in a group are cleared.
 */
export function toggleSupersetLink(
  groups: SupersetGroups,
  index: number,
): (number | null)[] {
  const result = groups.map((g) => g ?? null);
  if (index < 0 || index + 1 >= groups.length) return result;

  const current = groups[index] ?? null;
  const next = groups[index + 1] ?? null;
  const newGroupId = Math.max(0, ...groups.map((g) => g ?? 0)) + 1;

  if (current !== null && current === next) {
    const tail: number[] = [];
    for (let i = index + 1; i < groups.length && groups[i] === current; i++) {
      tail.push(i);
    }
    tail.forEach((i) => {
      result[i] = tail.length > 1 ? newGroupId : null;
    });

    const headCount = groups.filter((g, i) => g === current && i <= index)
      .length;
    if (headCount === 1) result[index] = null;
    return result;
  }

  const group = current ?? next ?? newGroupId;
  if (next !== null) {
    groups.forEach((g, i) => {
      if (g === next) result[i] = group;
    });
  }
  result[index] = group;
  result[index + 1] = group;
  return result;
}

export interface PerformedExercise {
  exerciseId: number;
  name: string;
  /** Completed sets, not counting warm-ups. */
  sets: number;
}

export interface RoutineDiff {
  added: PerformedExercise[];
  removed: { exerciseId: number; name: string }[];
  changed: { exerciseId: number; name: string; from: number; to: number }[];
}

/** What a finished workout did differently from the routine it was based on. */
export function diffRoutine(
  routineItems: { exerciseId: number; targetSets: number; exercise: { name: string } }[],
  performed: PerformedExercise[],
): RoutineDiff {
  const targets = new Map(routineItems.map((item) => [item.exerciseId, item]));
  const done = new Map(performed.map((p) => [p.exerciseId, p]));

  return {
    added: performed.filter((p) => !targets.has(p.exerciseId)),
    removed: routineItems
      .filter((item) => !done.has(item.exerciseId))
      .map((item) => ({ exerciseId: item.exerciseId, name: item.exercise.name })),
    changed: performed.flatMap((p) => {
      const item = targets.get(p.exerciseId);
      return item && item.targetSets !== p.sets
        ? [{ exerciseId: p.exerciseId, name: p.name, from: item.targetSets, to: p.sets }]
        : [];
    }),
  };
}

export const hasRoutineDiff = (diff: RoutineDiff) =>
  diff.added.length + diff.removed.length + diff.changed.length > 0;

function clearBrokenSupersetLinks(
  groups: (number | null)[],
): (number | null)[] {
  const result: (number | null)[] = groups.map(() => null);
  for (let index = 0; index < groups.length; index++) {
    const group = groups[index];
    if (group === null) continue;

    const linkedToNext = groups[index + 1] === group;
    const linkedToPrevious = groups[index - 1] === group;
    if (linkedToNext || linkedToPrevious) {
      result[index] = group;
    }
  }
  return result;
}

export function reorderRoutineItems<T extends { supersetGroup?: number | null }>(
  items: readonly T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  const reordered = moveItem(items, fromIndex, toIndex);
  const groups = clearBrokenSupersetLinks(
    reordered.map((item) => item.supersetGroup ?? null),
  );
  return reordered.map((item, index) => ({
    ...item,
    supersetGroup: groups[index],
  }));
}


export interface TargetSummary {
  targetSets: number;
  targetReps: number | null;
  targetWeight: number | null;
  targetDurationSecs: number | null;
  targetDistanceMeters: number | null;
}

const METERS_PER_KM = 1000;
const SECS_PER_MINUTE = 60;

const formatClock = (totalSecs: number) => {
  const mins = Math.floor(totalSecs / SECS_PER_MINUTE);
  const secs = Math.round(totalSecs % SECS_PER_MINUTE);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const formatMeters = (meters: number) =>
  meters >= METERS_PER_KM
    ? `${Number((meters / METERS_PER_KM).toFixed(2))} km`
    : `${Math.round(meters)} m`;

/**
 * A routine item's target in words: `3 x 10 @ 40 kg` for strength work,
 * `3 x 00:45` for a timed hold and `2 km in 12:00` for distance work.
 */
export function formatTarget(target: TargetSummary, unit: WeightUnit): string {
  const {
    targetSets,
    targetReps,
    targetWeight,
    targetDurationSecs,
    targetDistanceMeters,
  } = target;

  if (targetDurationSecs && targetDistanceMeters) {
    return `${formatMeters(targetDistanceMeters)} in ${formatClock(targetDurationSecs)}`;
  }
  if (targetReps) {
    const reps = `${targetSets} x ${targetReps}`;
    return targetWeight ? `${reps} @ ${formatWeight(targetWeight, unit)}` : reps;
  }
  if (targetDurationSecs) {
    return `${targetSets} x ${formatClock(targetDurationSecs)}`;
  }
  return `${targetSets} sets`;
}
