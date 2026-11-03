export interface Goals {
  weekly: { target: number; completed: number } | null;
  bodyWeight: { targetKg: number; currentKg: number | null } | null;
  lift: {
    exerciseId: number;
    exerciseName: string;
    targetKg: number;
    bestKg: number | null;
  } | null;
}
