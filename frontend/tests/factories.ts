import { Exercise, Muscle } from "@/src/features/exercises/types";
import { Metrics, MetricsType } from "@/src/features/exercises/schemas";
import { Exercise as ActiveExercise, ActiveSet } from "@/src/features/workout/store";
import { Routine } from "@/src/features/routines/types";
import { Workout, WorkoutSet } from "@/src/features/workout/types";

export function makeExercise(
  overrides: Partial<Exercise> & { id: number; metrics: Metrics },
): Exercise {
  return {
    name: `Exercise ${overrides.id}`,
    instructions: "",
    videoUrl: "",
    imageUrl: "",
    equipment: "none",
    muscles: [{ name: "Chest", contributionType: "primary" }] as Muscle[],
    ...overrides,
  };
}

export const benchPress = makeExercise({
  id: 1,
  name: "Bench Press",
  metrics: MetricsType.REPS_WEIGHT,
});
export const pushUp = makeExercise({
  id: 2,
  name: "Push Up",
  metrics: MetricsType.REPS,
});
export const squat = makeExercise({
  id: 5,
  name: "Squat",
  metrics: MetricsType.REPS_WEIGHT,
});
export const plank = makeExercise({
  id: 3,
  name: "Plank",
  metrics: MetricsType.DURATION,
});
export const running = makeExercise({
  id: 4,
  name: "Running",
  metrics: MetricsType.DURATION_DISTANCE,
});

export function makeActiveExercise(
  exercise: Exercise,
  sets: ActiveSet[] = [],
): ActiveExercise {
  return { ...exercise, sets };
}

export function makeWorkoutSet(
  exercise: Exercise,
  overrides: Partial<WorkoutSet> = {},
): WorkoutSet {
  return {
    id: 1,
    workoutId: 1,
    exercise,
    exerciseId: exercise.id,
    setIndex: 1,
    ...overrides,
  };
}

export function makeWorkout(
  sets: WorkoutSet[],
  overrides: Partial<Workout> = {},
): Workout {
  return {
    id: 1,
    routineId: 1,
    completedAt: new Date("2025-01-06T10:00:00Z"),
    duration: 3600,
    sets,
    ...overrides,
  };
}

export function makeRoutine(
  overrides: Partial<Routine> = {},
  exercises: Exercise[] = [benchPress, pushUp],
): Routine {
  return {
    id: 7,
    name: "Push day",
    day: 0,
    startTime: "18:30:00",
    routineItems: exercises.map((exercise, order) => ({
      routineId: 7,
      exerciseId: exercise.id,
      targetSets: 3,
      targetReps: 10,
      targetDurationSecs: null,
      order,
      exercise,
    })),
    ...overrides,
  };
}
