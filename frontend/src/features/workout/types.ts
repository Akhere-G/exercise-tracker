import { Exercise } from "../exercises/types";
import { SetType } from "./schema";

export interface WorkoutSet {
  id: number;
  workoutId: number;
  exercise: Exercise;

  exerciseId: number;
  setIndex: number;
  reps?: number;
  weight?: number;
  durationSecs?: number;
  distanceMeters?: number;
  setType?: SetType;
  rpe?: number | null;
  rir?: number | null;
  supersetGroup?: number | null;
}

export interface PreviousSet {
  exerciseId: number;
  setIndex: number;
  reps?: number;
  weight?: number;
  distanceMeters?: number;
  durationSecs?: number;
  setType?: SetType;
  rpe?: number | null;
  rir?: number | null;
}

export interface Workout {
  id: number;
  routineId: number;
  completedAt: Date;
  duration: number;
  sets: WorkoutSet[];
}

export interface WorkoutStats {
  weeklyStreak: number;
  workoutCount: number;
}

export interface workoutSetWithDate extends WorkoutSet {
  completedAt: string;
}
