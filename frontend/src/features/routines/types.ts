export interface RoutineItem {
  routineId: number;
  exerciseId: number;
  targetSets: number;
  targetReps: number;
  order: number;
}

export interface Routine {
  id: number;
  name: string;
  day: string;
  startTime: string | null;
  routineItems: RoutineItem[];
}
