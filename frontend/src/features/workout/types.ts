import { Exercise } from "../exercises/types";

export interface WorkoutSet {
  id: number;
  workoutId: number;
  exercise: Exercise;

  exerciseId: number;
  setIndex: number;
  reps?: number;
  weight?: number;
  durationSecs?: number;
}
export interface Workout {
  id: number;
  routineId: number;
  completedAt: Date;
  duration: number;
  sets: WorkoutSet[];
}
