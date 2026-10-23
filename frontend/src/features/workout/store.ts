import { create } from "zustand";
import { WorkoutSetSchema } from "./schema";
import { persist } from "zustand/middleware";
import { Exercise as BaseExercise } from "../exercises/types";

export interface ActiveSet extends WorkoutSetSchema {
  isCompleted?: boolean;
}

export interface Exercise extends BaseExercise {
  sets: ActiveSet[];
}

export const workoutStorageKey = "workout-storage";
export const workoutOwnerKey = "workout-storage-owner";

export interface WorkoutState {
  routineId: number | null;
  routineName: string | null;
  startedAt: Date | null;
  duration: number | null;
  exercises: Exercise[];
  currentExerciseId: number;

  // Actions
  setWorkoutData: (
    workoutData: Partial<Omit<WorkoutState, "setWorkoutData" | "addSet">>,
  ) => void;
  addSet: (workoutSet: WorkoutSetSchema) => void;
  resetState: () => void;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStoredExercise = (value: unknown): value is Exercise =>
  isRecord(value) &&
  typeof value.id === "number" &&
  Array.isArray(value.sets) &&
  value.sets.every(isRecord);

/**
 * Validates persisted workout state (which may be stale, hand-edited or from an
 * older app version). Returns the usable fields, or null when there is no
 * in-progress workout worth restoring.
 */
export const sanitizeStoredWorkout = (
  value: unknown,
): Partial<WorkoutState> | null => {
  if (!isRecord(value)) return null;
  if (!Array.isArray(value.exercises) || !value.exercises.every(isStoredExercise))
    return null;

  const exercises: Exercise[] = value.exercises;
  const startedAt =
    typeof value.startedAt === "string" || value.startedAt instanceof Date
      ? new Date(value.startedAt)
      : null;
  const hasStartedAt = startedAt !== null && !isNaN(startedAt.getTime());

  if (exercises.length === 0 && !hasStartedAt) return null;

  const currentExerciseId =
    typeof value.currentExerciseId === "number" &&
    exercises.some((e) => e.id === value.currentExerciseId)
      ? value.currentExerciseId
      : (exercises[0]?.id ?? 0);

  return {
    routineId: typeof value.routineId === "number" ? value.routineId : null,
    routineName:
      typeof value.routineName === "string" ? value.routineName : null,
    startedAt: hasStartedAt ? startedAt : null,
    duration: typeof value.duration === "number" ? value.duration : null,
    exercises,
    currentExerciseId,
  };
};

/** Reads the saved in-progress workout straight from localStorage, if any. */
export const readStoredWorkout = (): Partial<WorkoutState> | null => {
  try {
    const raw = localStorage.getItem(workoutStorageKey);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return sanitizeStoredWorkout(isRecord(parsed) ? parsed.state : null);
  } catch {
    return null;
  }
};

export const useWorkout = create<WorkoutState>()(
  persist(
    (set) => ({
      routineId: null,
      routineName: null,
      startedAt: null,
      duration: null,
      exercises: [],
      currentExerciseId: 0,
      setWorkoutData: (workoutData) =>
        set((state) => ({ ...state, ...workoutData })),
      addSet: (workoutSet) =>
        set((state) => ({
          exercises: state.exercises.map((e) =>
            e.id === state.currentExerciseId
              ? { ...e, sets: e.sets.concat(workoutSet) }
              : e,
          ),
        })),
      resetState: () =>
        set({
          routineId: null,
          routineName: null,
          startedAt: null,
          duration: null,
          exercises: [],
          currentExerciseId: 0,
        }),
    }),
    {
      name: workoutStorageKey,
      merge: (persisted, current) => ({
        ...current,
        ...sanitizeStoredWorkout(persisted),
      }),
    },
  ),
);
