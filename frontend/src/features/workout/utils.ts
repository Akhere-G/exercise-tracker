import { Slug } from "react-muscle-highlighter";
import { Exercise as BaseExercise } from "../exercises/types";
import {
  isCardioExercise,
  isDurationExercise,
  isRepsExercise,
  isWeightsExercise,
} from "../exercises/utils";
import { RoutineItem } from "../routines/types";
import { WorkoutSetSchema } from "./schema";
import { ActiveSet, Exercise } from "./store";
import { PreviousSet, Workout, WorkoutSet } from "./types";
import { formatWeight, toDisplayWeight, WeightUnit } from "@/src/lib/units";
import { SetType } from "./schema";

const DEFAULT_TOTAL_SETS = 3;
const DEFAULT_REPS = 10;
const DEFAULT_WEIGHT = 25;
const DEFAULT_DURATION = 600; // 10 minutes in seconds
const DEFAULT_DISTANCE = 500;

export const sameMetrics = (
  exercise: BaseExercise,
  otherExercise: BaseExercise,
) => {
  return (
    (isRepsExercise(exercise) && isRepsExercise(otherExercise)) ||
    (isDurationExercise(exercise) && isDurationExercise(otherExercise))
  );
};
interface SetValues {
  reps?: number | null;
  weight?: number | null;
  distanceMeters?: number | null;
  durationSecs?: number | null;
}

interface SetSources {
  /** The routine's targets for this exercise. */
  routineItem?: RoutineItem;
  /** What the user did the last time they trained this exercise. */
  previousSets?: PreviousSet[];
}

/**
 * Builds one set with only the fields the exercise type tracks. Routine targets
 * decide reps and duration, and the last session decides weight and distance.
 */
const buildSet = (
  exercise: BaseExercise,
  setIndex: number,
  { routineItem, values }: { routineItem?: RoutineItem; values?: SetValues },
): ActiveSet => ({
  exerciseId: exercise.id,
  setIndex,
  durationSecs: isDurationExercise(exercise)
    ? (routineItem?.targetDurationSecs ??
      values?.durationSecs ??
      DEFAULT_DURATION)
    : undefined,
  reps: isRepsExercise(exercise)
    ? (routineItem?.targetReps ?? values?.reps ?? DEFAULT_REPS)
    : undefined,
  weight: isWeightsExercise(exercise)
    ? (values?.weight ?? DEFAULT_WEIGHT)
    : undefined,
  distanceMeters: isCardioExercise(exercise)
    ? (values?.distanceMeters ?? DEFAULT_DISTANCE)
    : undefined,
  isCompleted: false,
});

export const getDefaultSets = (
  exercise: BaseExercise,
  oldExercise?: Exercise,
  { routineItem, previousSets = [] }: SetSources = {},
) => {
  if (oldExercise && sameMetrics(oldExercise, exercise)) {
    return oldExercise.sets;
  }

  const lastWorkingSets = previousSets.filter(isWorkingSet);
  const count =
    routineItem?.targetSets ?? (lastWorkingSets.length || DEFAULT_TOTAL_SETS);

  return Array.from({ length: count }, (_, i) =>
    buildSet(exercise, i + 1, {
      routineItem,
      values: lastWorkingSets[i] ?? lastWorkingSets[lastWorkingSets.length - 1],
    }),
  );
};

/** A set added mid-workout repeats the previous working set's values. */
export const getNewSet = (
  exercise: Exercise,
  routineItem?: RoutineItem,
  previousSets: PreviousSet[] = [],
): ActiveSet => {
  const workingSets = exercise.sets.filter(isWorkingSet);
  const last = workingSets[workingSets.length - 1];

  if (last) {
    return buildSet(exercise, exercise.sets.length + 1, { values: last });
  }

  const lastWorkingSets = previousSets.filter(isWorkingSet);
  return buildSet(exercise, exercise.sets.length + 1, {
    routineItem,
    values: lastWorkingSets[lastWorkingSets.length - 1],
  });
};

/**
 * The set from the last session that lines up with this one, matching warm-ups
 * with warm-ups so a warm-up never shifts the working sets out of step.
 */
export const getPreviousForSet = (
  previousSets: PreviousSet[],
  sets: ActiveSet[],
  set: ActiveSet,
) => {
  const isWarmup = set.setType === "warmup";
  const sameKind = <T extends { setType?: string }>(list: T[]) =>
    list.filter((s) => (s.setType === "warmup") === isWarmup);

  const position = sameKind(sets).findIndex((s) => s.setIndex === set.setIndex);
  return sameKind(previousSets)[position];
};

/** Warm-up sets are excluded from volume, records and strength estimates. */
export const isWorkingSet = (set: { setType?: string }) =>
  set.setType !== "warmup";

export const isExerciseCompleted = (exercise: Exercise) =>
  exercise.sets.every((s) => s.isCompleted);

export const isWorkoutCompleted = (exercises: Exercise[]) =>
  exercises.every((e) => isExerciseCompleted(e));

export const getOrdinalSuffix = (num: number) => {
  switch (num % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

const muscleMapping: Record<string, Slug> = {
  abdominals: "abs",
  "ankle stabilizers": "ankles",
  ankles: "ankles",
  back: "upper-back",
  biceps: "biceps",
  brachialis: "biceps",
  calves: "calves",
  chest: "chest",
  core: "abs",
  deltoids: "deltoids",
  feet: "feet",
  forearms: "forearm",
  glutes: "gluteal",
  "grip muscles": "forearm",
  groin: "adductors",
  hamstrings: "hamstring",
  hands: "hands",
  "hip flexors": "adductors",
  "inner thighs": "adductors",
  "latissimus dorsi": "upper-back",
  lats: "upper-back",
  "lower abs": "abs",
  "lower back": "lower-back",
  obliques: "obliques",
  quadriceps: "quadriceps",
  "rear deltoids": "deltoids",
  rhomboids: "upper-back",
  "rotator cuff": "deltoids",
  shins: "tibialis",
  shoulders: "deltoids",
  soleus: "calves",
  sternocleidomastoid: "neck",
  trapezius: "trapezius",
  traps: "trapezius",
  triceps: "triceps",
  "upper back": "upper-back",
  "upper chest": "chest",
  "wrist extensors": "forearm",
  "wrist flexors": "forearm",
  wrists: "forearm",
};

export function mapToTargetMuscle(muscleName: string): Slug | undefined {
  if (!muscleName) return undefined;

  const normalisedName = muscleName.toLowerCase().trim();
  return muscleMapping[normalisedName];
}

export function getGreyShadeCSS(intensity: number): string {
  const MAX_INTENSITY = 12;
  const clamped = Math.max(0, Math.min(MAX_INTENSITY, intensity));

  const minLightness = 40;
  const maxLightness = 100;

  const lightness =
    maxLightness + (clamped / MAX_INTENSITY) * (minLightness - maxLightness);

  return `hsl(0, 100%, ${Math.round(lightness)}%)`;
}

export const getSetVolume = (
  exercise: BaseExercise,
  set: WorkoutSetSchema,
  unit: WeightUnit = "kg",
) => {
  if (isCardioExercise(exercise)) {
    return `${set.distanceMeters}m in ${getTime(set.durationSecs!)} mins`;
  }

  if (isDurationExercise(exercise)) {
    return getTime(set.durationSecs!) + " mins";
  }

  if (isWeightsExercise(exercise)) {
    return `${set.reps!} x ${formatWeight(set.weight ?? 0, unit)}`;
  }

  return set.reps! + " reps";
};

export const getVolume = (exercise: Exercise, unit: WeightUnit = "kg") => {
  if (isDurationExercise(exercise)) {
    const totalSecs = exercise.sets.reduce(
      (prev, curr) => prev + curr.durationSecs!,
      0,
    );
    return getTime(totalSecs) + " mins";
  }

  if (isWeightsExercise(exercise)) {
    const totalWeight = exercise.sets.reduce(
      (prev, curr) =>
        curr.setType === "warmup" ? prev : prev + curr.weight! * curr.reps!,
      0,
    );
    return formatWeight(totalWeight, unit);
  }

  const totalReps = exercise.sets.reduce((prev, curr) => prev + curr.reps!, 0);
  return totalReps + " reps";
};

export const getTotalVolume = (exercises: Exercise[]) => {
  const volume = exercises.reduce(
    (prev, curr) =>
      prev +
      (!isWeightsExercise(curr)
        ? 0
        : curr.sets.reduce(
            (prev, curr) =>
              curr.setType === "warmup" ? prev : prev + curr.reps! * curr.weight!,
            0,
          )),
    0,
  );

  return volume;
};

export const getTime = (totalSecs: number) => {
  let mins = Math.floor(totalSecs / 60).toString();
  if (mins.length === 1) mins = mins.padStart(2, "0");
  let secs = (totalSecs % 60).toString();
  if (secs.length === 1) secs = secs.padStart(2, "0");

  return `${mins}:${secs}`;
};

export function getTotalTime(workouts: Workout[]) {
  const totalSecs = workouts.reduce((prev, curr) => prev + curr.duration, 0);
  return Math.ceil(totalSecs / 60);
}

export function getTotalWorkoutsVolume(workouts: Workout[]) {
  let volume = 0;

  for (const workout of workouts) {
    volume += getWorkoutVolume(workout.sets);
  }

  return volume;
}

export function getWorkoutVolume(sets: WorkoutSet[]) {
  let volume = 0;

  for (const set of sets) {
    if (isWeightsExercise(set.exercise) && set.setType !== "warmup") {
      volume += set.weight! * set.reps!;
    }
  }

  return volume;
}

// in minutes
export function getWorkoutDuration(sets: WorkoutSet[]) {
  let duration = 0;

  for (const set of sets) {
    if (isDurationExercise(set.exercise)) {
      duration += set.durationSecs!;
    }
  }

  return duration / 60;
}

export function getWorkoutReps(sets: WorkoutSet[]) {
  let reps = 0;

  for (const set of sets) {
    if (isRepsExercise(set.exercise)) {
      reps += set.reps!;
    }
  }

  return reps;
}

export function getWorkoutDistance(sets: WorkoutSet[]) {
  let distance = 0;
  for (const set of sets) {
    if (isCardioExercise(set.exercise)) {
      distance += set.distanceMeters!;
    }
  }

  return distance;
}

export function getWorkoutPace(sets: WorkoutSet[]) {
  let totalDuration = 0;
  let totalDistance = 0;
  let cardioSetCount = 0;

  for (const set of sets) {
    if (
      isCardioExercise(set.exercise) &&
      set.durationSecs &&
      set.distanceMeters
    ) {
      totalDuration += set.durationSecs;
      totalDistance += set.distanceMeters;
      cardioSetCount++;
    }
  }

  if (cardioSetCount === 0 || totalDistance === 0) return 0;

  const secondsPerMetre = totalDuration / totalDistance;
  const minutesPerKm = secondsPerMetre * (1000 / 60);

  return minutesPerKm;
}

const SET_TYPE_ORDER: SetType[] = ["normal", "warmup", "drop", "failure"];

export const nextSetType = (current: SetType = "normal"): SetType =>
  SET_TYPE_ORDER[(SET_TYPE_ORDER.indexOf(current) + 1) % SET_TYPE_ORDER.length];

/** W / D / F for special sets, otherwise the position among normal sets. */
export const getSetLabel = (sets: ActiveSet[], set: ActiveSet) => {
  switch (set.setType) {
    case "warmup":
      return "W";
    case "drop":
      return "D";
    case "failure":
      return "F";
    default:
      return String(
        sets.filter(
          (s) => s.setIndex <= set.setIndex && (s.setType ?? "normal") === "normal",
        ).length,
      );
  }
};

export const getSupersetMembers = (
  exercises: Exercise[],
  group: number | null | undefined,
) =>
  group == null ? [] : exercises.filter((e) => e.supersetGroup === group);

/** Groups with fewer than two exercises are not really supersets. */
export const getActiveSupersetGroup = (
  exercises: Exercise[],
  exercise: Exercise,
) =>
  getSupersetMembers(exercises, exercise.supersetGroup).length > 1
    ? exercise.supersetGroup!
    : null;

export const linkWithNext = (
  exercises: Exercise[],
  exerciseId: number,
): Exercise[] => {
  const index = exercises.findIndex((e) => e.id === exerciseId);
  const current = exercises[index];
  const next = exercises[index + 1];
  if (!current || !next) return exercises;

  const group =
    current.supersetGroup ??
    next.supersetGroup ??
    Math.max(0, ...exercises.map((e) => e.supersetGroup ?? 0)) + 1;

  return exercises.map((e) =>
    e.id === current.id || e.id === next.id ? { ...e, supersetGroup: group } : e,
  );
};

export const unlinkSuperset = (
  exercises: Exercise[],
  exerciseId: number,
): Exercise[] =>
  exercises.map((e) =>
    e.id === exerciseId ? { ...e, supersetGroup: null } : e,
  );

export const DEFAULT_REST_SECS = 180;

export const formatPreviousSet = (
  exercise: BaseExercise,
  set: {
    reps?: number;
    weight?: number;
    distanceMeters?: number;
    durationSecs?: number;
  },
  unit: WeightUnit,
) => {
  if (isCardioExercise(exercise)) {
    return `${set.distanceMeters ?? 0}m`;
  }
  if (isDurationExercise(exercise)) {
    return getTime(set.durationSecs ?? 0);
  }
  if (isWeightsExercise(exercise)) {
    return `${toDisplayWeight(set.weight ?? 0, unit)}×${set.reps ?? 0}`;
  }
  return `${set.reps ?? 0}`;
};

/** Exercises for a new workout that repeats a past one, with nothing completed. */
export const getExercisesFromWorkout = (workout: Workout): Exercise[] => {
  const byExercise = new Map<number, Exercise>();

  [...workout.sets]
    .sort((a, b) => a.id - b.id)
    .forEach((set) => {
      const exercise = byExercise.get(set.exerciseId) ?? {
        ...set.exercise,
        sets: [],
        restSecs: null,
        supersetGroup: set.supersetGroup ?? null,
      };
      exercise.sets.push({
        exerciseId: set.exerciseId,
        setIndex: exercise.sets.length + 1,
        reps: set.reps,
        weight: set.weight,
        durationSecs: set.durationSecs,
        distanceMeters: set.distanceMeters,
        setType: set.setType,
        isCompleted: false,
      });
      byExercise.set(set.exerciseId, exercise);
    });

  const exercises = [...byExercise.values()];
  // A superset needs at least two members.
  return exercises.map((e) =>
    getActiveSupersetGroup(exercises, e) === null
      ? { ...e, supersetGroup: null }
      : e,
  );
};
