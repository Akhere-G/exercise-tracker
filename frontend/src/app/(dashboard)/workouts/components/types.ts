import { Exercise as BaseExercise } from "@/src/features/exercises/types";
import { WorkoutSetSchema } from "@/src/features/workout/schema";

export interface FormSetRow extends WorkoutSetSchema {
  exercise: BaseExercise;
}

export interface ExerciseGroup {
  exercise: BaseExercise;
  indices: number[];
}
