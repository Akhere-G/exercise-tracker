import { Exercise } from "../exercises/types";

export interface RoutineItem {
  routineId: number;
  exerciseId: number;
  targetSets: number;
  targetReps: number | null;
  targetDurationSecs: number | null;
  order: number;
  exercise: Exercise;
}

export interface Routine {
  id: number;
  name: string;
  day: number;
  startTime: string | null;
  routineItems: RoutineItem[];
}
