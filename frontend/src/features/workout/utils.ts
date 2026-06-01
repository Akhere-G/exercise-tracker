import { Exercise as BaseExercise } from "../exercises/types";
import {
  isDurationExercise,
  isRepsExercise,
  isWeightsExercise,
} from "../exercises/utils";
import { RoutineItem } from "../routines/types";
import { WorkoutSetSchema } from "./schema";
import { ActiveSet, Exercise } from "./store";

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
        ? routineItem.targetDurationSecs / 60
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
