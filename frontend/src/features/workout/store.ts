import { create } from "zustand";
import { WorkoutSetSchema } from "./schema";
import { persist } from "zustand/middleware";
import { Exercise as BaseExercise } from "../exercises/types";

export interface Exercise extends BaseExercise {
  sets: WorkoutSetSchema[];
}

interface WorkoutState {
  routineId: number | null;
  completedAt: Date | string | null;
  duration: number | null;
  exercises: Exercise[];
  currentExerciseId: number;

  // Actions
  setWorkoutData: (
    workoutData: Partial<Omit<WorkoutState, "setWorkoutData" | "addSet">>,
  ) => void;
  addSet: (workoutSet: WorkoutSetSchema) => void;
}

export const useWorkout = create<WorkoutState>()(
  persist(
    (set) => ({
      routineId: null,
      completedAt: null,
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
    }),
    {
      name: "workout-storage",
    },
  ),
);
