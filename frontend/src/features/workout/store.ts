import { create } from "zustand";
import { WorkoutSetSchema } from "./schema";
import { persist } from "zustand/middleware";

interface WorkoutState {
  routineId: number | null;
  completedAt: Date | string | null;
  duration: number | null;
  sets: WorkoutSetSchema[];

  // Actions
  setRoutineData: (
    routineData: Partial<Omit<WorkoutState, "setRoutineData" | "addSet">>,
  ) => void;
  addSet: (workoutSet: WorkoutSetSchema) => void;
}

export const useWorkout = create<WorkoutState>()(
  persist(
    (set) => ({
      routineId: null,
      completedAt: null,
      duration: null,
      sets: [],
      setRoutineData: (routineData) =>
        set((state) => ({ ...state, ...routineData })),
      addSet: (workoutSet) =>
        set((state) => ({ sets: [...state.sets, workoutSet] })),
    }),
    {
      name: "workout-storage",
    },
  ),
);
