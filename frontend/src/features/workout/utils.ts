import { Exercise } from "../exercises/types";
import {
  isDurationExercise,
  isRepsExercise,
  isWeightsExercise,
} from "../exercises/utils";
import { WorkoutSetSchema } from "./schema";

const DEFAULT_TOTAL_SETS = 3;
const DEFAULT_REPS = 10;
const DEFAULT_WEIGHT = 25;
const DEFAULT_DURATION = 10;

export const getDefaultSets = (exercise: Exercise) => {
  const sets: WorkoutSetSchema[] = [];

  for (let i = 1; i <= DEFAULT_TOTAL_SETS; i++) {
    const set: WorkoutSetSchema = {
      exerciseId: exercise.id,
      setIndex: i,
      durationSecs: isDurationExercise(exercise) ? DEFAULT_DURATION : undefined,
      reps: isRepsExercise(exercise) ? DEFAULT_REPS : undefined,
      weight: isWeightsExercise(exercise) ? DEFAULT_WEIGHT : undefined,
    };
    sets.push(set);
  }

  return sets;
};
