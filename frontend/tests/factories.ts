import { Exercise, Muscle } from "@/src/features/exercises/types";
import { Metrics, MetricsType } from "@/src/features/exercises/schemas";
import {
  Exercise as ActiveExercise,
  ActiveSet,
} from "@/src/features/workout/store";
import { Routine, RoutineItem } from "@/src/features/routines/types";
import { PreviousSet, Workout, WorkoutSet } from "@/src/features/workout/types";
import { DEFAULT_PROFILE, Profile } from "@/src/features/profile/types";

/** Realistic, typed test data. Every builder returns a fresh object. */

export function makeExercise(
  overrides: Partial<Exercise> & { id: number; metrics: Metrics },
): Exercise {
  return {
    name: `Exercise ${overrides.id}`,
    instructions: "",
    videoUrl: "",
    imageUrl: "",
    equipment: "barbell",
    muscles: [{ name: "Chest", contributionType: "primary" }] as Muscle[],
    ...overrides,
  };
}

export const benchPress = makeExercise({
  id: 1,
  name: "Bench Press",
  metrics: MetricsType.REPS_WEIGHT,
  muscles: [
    { name: "Chest", contributionType: "primary" },
    { name: "Triceps", contributionType: "secondary" },
  ],
});
export const pushUp = makeExercise({
  id: 2,
  name: "Push Up",
  equipment: "body weight",
  metrics: MetricsType.REPS,
});
export const plank = makeExercise({
  id: 3,
  name: "Plank",
  equipment: "body weight",
  metrics: MetricsType.DURATION,
  muscles: [{ name: "Abdominals", contributionType: "primary" }],
});
export const running = makeExercise({
  id: 4,
  name: "Running",
  equipment: "none",
  metrics: MetricsType.DURATION_DISTANCE,
  muscles: [{ name: "Quadriceps", contributionType: "primary" }],
});
export const squat = makeExercise({
  id: 5,
  name: "Squat",
  metrics: MetricsType.REPS_WEIGHT,
  muscles: [
    { name: "Quadriceps", contributionType: "primary" },
    { name: "Glutes", contributionType: "secondary" },
  ],
});

export function makeSet(
  overrides: Partial<ActiveSet> & { exerciseId: number },
): ActiveSet {
  return { setIndex: 1, setType: "normal", isCompleted: false, ...overrides };
}

export function makeActiveExercise(
  exercise: Exercise,
  sets: Partial<ActiveSet>[] = [],
  overrides: Partial<ActiveExercise> = {},
): ActiveExercise {
  return {
    ...exercise,
    sets: sets.map((set, i) =>
      makeSet({ exerciseId: exercise.id, setIndex: i + 1, ...set }),
    ),
    ...overrides,
  };
}

export function makePreviousSet(
  overrides: Partial<PreviousSet> & { exerciseId: number },
): PreviousSet {
  return { setIndex: 1, setType: "normal", ...overrides };
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
    setType: "normal",
    ...overrides,
  };
}

export function makeWorkout(
  sets: WorkoutSet[],
  overrides: Partial<Workout> = {},
): Workout {
  return {
    id: 1,
    routineId: 7,
    completedAt: new Date("2026-11-02T10:00:00Z"),
    duration: 3600,
    sets,
    ...overrides,
  };
}

export function makeRoutineItem(
  exercise: Exercise,
  overrides: Partial<RoutineItem> = {},
): RoutineItem {
  return {
    routineId: 7,
    exerciseId: exercise.id,
    targetSets: 3,
    targetReps: 10,
    targetDurationSecs: null,
    order: 0,
    restSecs: null,
    supersetGroup: null,
    exercise,
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
    startTime: "18:30:00Z",
    routineItems: exercises.map((exercise, order) =>
      makeRoutineItem(exercise, { order }),
    ),
    ...overrides,
  };
}

export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    ...DEFAULT_PROFILE,
    onboardedAt: "2026-10-01T00:00:00Z",
    ...overrides,
  };
}
