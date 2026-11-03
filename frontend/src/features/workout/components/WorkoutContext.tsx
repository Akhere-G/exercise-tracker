"use client";
import { createContext, useContext } from "react";
import { PreviousSet } from "../types";

type PreviousSetsByExercise = Record<number, PreviousSet[]>;

interface WorkoutContextValue {
  /** Sets from the last workout for each exercise, keyed by exercise id. */
  previousSets: PreviousSetsByExercise;
  /** Loads last-session sets for exercises not fetched yet. */
  ensurePreviousSets: (exerciseIds: number[]) => Promise<PreviousSetsByExercise>;
  /** The user's saved rest time in seconds for each exercise. */
  restSettings: Record<number, number | null>;
  setRestSetting: (exerciseId: number, restSecs: number | null) => void;
}

const WorkoutContext = createContext<WorkoutContextValue>({
  previousSets: {},
  ensurePreviousSets: async () => ({}),
  restSettings: {},
  setRestSetting: () => {},
});

export const WorkoutContextProvider = WorkoutContext.Provider;

export const usePreviousSets = () => useContext(WorkoutContext).previousSets;
export const useEnsurePreviousSets = () =>
  useContext(WorkoutContext).ensurePreviousSets;
export const useRestSettings = () => {
  const { restSettings, setRestSetting } = useContext(WorkoutContext);
  return { restSettings, setRestSetting };
};
