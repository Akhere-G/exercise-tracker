import { Exercise as BaseExercise } from "../exercises/types";
import {
  isDurationExercise,
  isRepsExercise,
  isWeightsExercise,
} from "../exercises/utils";
import { WorkoutSetSchema } from "./schema";
import { ActiveSet, Exercise } from "./store";

const DEFAULT_TOTAL_SETS = 3;
const DEFAULT_REPS = 10;
const DEFAULT_WEIGHT = 25;
const DEFAULT_DURATION = 10;

export const getDefaultSets = (exercise: BaseExercise) => {
  const sets: ActiveSet[] = [];

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

export const getNewSet = (exercise: Exercise): WorkoutSetSchema => {
  return {
    exerciseId: exercise.id,
    setIndex: exercise.sets.length + 1,
    durationSecs: isDurationExercise(exercise) ? DEFAULT_DURATION : undefined,
    reps: isRepsExercise(exercise) ? DEFAULT_REPS : undefined,
    weight: isWeightsExercise(exercise) ? DEFAULT_WEIGHT : undefined,
  };
};
