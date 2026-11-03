export type ProgressionAction = "increase" | "add_rep" | "repeat" | "reps_up";

export interface ProgressionSuggestion {
  exerciseId: number;
  action: ProgressionAction;
  weight: number | null;
  reps: number | null;
  reason: string;
}

export interface StalledExercise {
  exerciseId: number;
  name: string;
  reason: "stalled" | "declined";
}

export interface DeloadAssessment {
  shouldDeload: boolean;
  message?: string | null;
  reasons: string[];
  stalledExercises: StalledExercise[];
  suggestion?: { volumePercent: number; maxRpe: number } | null;
}
