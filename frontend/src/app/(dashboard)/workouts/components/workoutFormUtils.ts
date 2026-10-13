import {
  isCardioExercise,
  isDurationExercise,
  isRepsExercise,
  isWeightsExercise,
} from "@/src/features/exercises/utils";
import { Exercise as BaseExercise } from "@/src/features/exercises/types";
import { WorkoutSetSchema } from "@/src/features/workout/schema";
import { Workout } from "@/src/features/workout/types";
import { ExerciseGroup, FormSetRow } from "./types";

export function buildDefaultSet(
  exercise: BaseExercise,
  setIndex: number,
): WorkoutSetSchema {
  return {
    exerciseId: exercise.id,
    setIndex,
    reps: isRepsExercise(exercise) ? 10 : undefined,
    weight: isWeightsExercise(exercise) ? 25 : undefined,
    durationSecs: isDurationExercise(exercise) ? 10 : undefined,
    distanceMeters: isCardioExercise(exercise) ? 500 : undefined,
  };
}

export function buildSetsFromWorkout(workout: Workout): FormSetRow[] {
  return workout.sets.map((s) => ({
    exerciseId: s.exerciseId,
    setIndex: s.setIndex,
    reps: s.reps ?? undefined,
    weight: s.weight ?? undefined,
    durationSecs: s.durationSecs ? s.durationSecs / 60 : undefined,
    distanceMeters: s.distanceMeters ?? undefined,
    exercise: s.exercise,
  }));
}

export function groupByExercise(sets: FormSetRow[]): ExerciseGroup[] {
  const order: number[] = [];
  const map: Record<number, ExerciseGroup> = {};

  sets.forEach((set, idx) => {
    if (!map[set.exerciseId]) {
      map[set.exerciseId] = { exercise: set.exercise, indices: [] };
      order.push(set.exerciseId);
    }
    map[set.exerciseId].indices.push(idx);
  });

  return order.map((id) => map[id]);
}

export function toDatetimeLocal(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
