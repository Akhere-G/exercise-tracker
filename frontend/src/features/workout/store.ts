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
    },
  ),
);
