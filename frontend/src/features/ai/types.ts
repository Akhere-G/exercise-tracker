import { Profile } from "../profile/types";

export interface Persona {
  slug: Profile["coachPersona"];
  name: string;
  tagline: string;
}

export type Equipment =
  | "bodyweight"
  | "dumbbells"
  | "barbell"
  | "cables"
  | "machines"
  | "kettlebell"
  | "bands";

export interface PreviewItem {
  exerciseId: number;
  name: string;
  sets: number;
  reps: number;
  restSecs: number;
  supersetGroup: number | null;
}

export interface PreviewRoutine {
  name: string;
  day: number;
  items: PreviewItem[];
}

export interface RoutinePreview {
  routines: PreviewRoutine[];
  rationale: string;
}
