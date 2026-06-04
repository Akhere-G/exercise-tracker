import { Slug } from "react-muscle-highlighter";
import { Exercise as BaseExercise } from "../exercises/types";
import {
  isDurationExercise,
  isRepsExercise,
  isWeightsExercise,
} from "../exercises/utils";
import { RoutineItem } from "../routines/types";
import { WorkoutSetSchema } from "./schema";
import { ActiveSet, Exercise } from "./store";
import { Workout, WorkoutSet } from "./types";

const DEFAULT_TOTAL_SETS = 3;
const DEFAULT_REPS = 10;
const DEFAULT_WEIGHT = 25;
const DEFAULT_DURATION = 10;

export const sameMetrics = (
  exercise: BaseExercise,
  otherExercise: BaseExercise,
) => {
  return (
    (isRepsExercise(exercise) && isRepsExercise(otherExercise)) ||
    (isDurationExercise(exercise) && isDurationExercise(otherExercise))
  );
};
export const getDefaultSets = (
  exercise: BaseExercise,
  oldExercse?: Exercise,
) => {
  const sets: ActiveSet[] = [];

  if (oldExercse && sameMetrics(oldExercse, exercise)) {
    return oldExercse.sets;
  }

  for (let i = 1; i <= DEFAULT_TOTAL_SETS; i++) {
    const set: ActiveSet = {
      exerciseId: exercise.id,
      setIndex: i,
      durationSecs: isDurationExercise(exercise) ? DEFAULT_DURATION : undefined,
      reps: isRepsExercise(exercise) ? DEFAULT_REPS : undefined,
      weight: isWeightsExercise(exercise) ? DEFAULT_WEIGHT : undefined,
      isCompleted: false,
    };
    sets.push(set);
  }

  return sets;
};

export const getNewSet = (
  exercise: Exercise,
  routineItem?: RoutineItem,
): WorkoutSetSchema => {
  if (routineItem) {
    return {
      exerciseId: exercise.id,
      setIndex: exercise.sets.length + 1,
      durationSecs: isDurationExercise(exercise)
        ? routineItem.targetDurationSecs! / 60
        : undefined,
      reps: isRepsExercise(exercise) ? routineItem.targetReps : undefined,
      weight: isWeightsExercise(exercise) ? DEFAULT_WEIGHT : undefined,
    };
  }
  return {
    exerciseId: exercise.id,
    setIndex: exercise.sets.length + 1,
    durationSecs: isDurationExercise(exercise) ? DEFAULT_DURATION : undefined,
    reps: isRepsExercise(exercise) ? DEFAULT_REPS : undefined,
    weight: isWeightsExercise(exercise) ? DEFAULT_WEIGHT : undefined,
  };
};

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

export const getSetVolume = (exercise: Exercise, set: WorkoutSetSchema) => {
  if (isDurationExercise(exercise)) {
    return getTime(set.durationSecs!) + " mins";
  }

  if (isWeightsExercise(exercise)) {
    return `${set.reps!} x ${set.weight} kg`;
  }

  return set.reps! + " reps";
};

export const getVolume = (exercise: Exercise) => {
  if (isDurationExercise(exercise)) {
    const totalSecs = exercise.sets.reduce(
      (prev, curr) => prev + curr.durationSecs!,
      0,
    );
    return getTime(totalSecs) + " mins";
  }

  if (isWeightsExercise(exercise)) {
    const totalWeight = exercise.sets.reduce(
      (prev, curr) => prev + curr.weight! * curr.reps!,
      0,
    );
    return totalWeight + " kg";
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
            (prev, curr) => prev + curr.reps! * curr.weight!,
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
    for (const set of workout.sets) {
      if (isWeightsExercise(set.exercise)) {
        volume += set.weight! * set.reps!;
      }
    }
  }

  return volume;
}
