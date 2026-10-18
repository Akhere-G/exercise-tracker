import { Metrics } from "./schemas";

export interface Muscle {
  name: string;
  contributionType: string;
}
export interface Exercise {
  id: number;
  name: string;
  instructions: string;
  videoUrl: string;
  imageUrl: string;
  metrics: Metrics;
  equipment: string;
  muscles: Muscle[];
}
export interface RankedExercise extends Exercise {
  setCount: number;
  workoutCount: number;
  lastUser: string | null;
}

export interface ExerciseNoMuscles {
  id: number;
  name: string;
  instructions: string;
  videoUrl: string;
  imageUrl: string;
  metrics: Metrics;
  equipment: string;
}

export const PR_TYPES = ["pr_weight", "pr_distance", "pr_reps", "pr_duration"];
