import { Profile } from "../profile/types";

export type WrappedTheme = NonNullable<Profile["wrappedTheme"]>;
export type WrappedPeriod = "month" | "year";

interface NamedCount {
  name: string;
  count: number;
}

export interface Wrapped {
  period: WrappedPeriod;
  start: string;
  end: string;
  workoutCount: number;
  totalVolume: number;
  totalSets: number;
  totalDurationSecs: number;
  distinctExercises: number;
  longestStreakDays: number;
  prCount: number;
  topExercise: NamedCount | null;
  topMuscleGroup: NamedCount | null;
  favouriteWeekday: number | null;
  favouriteTimeOfDay: string | null;
  biggestSession: {
    workoutId: number;
    completedAt: string;
    volume: number;
  } | null;
  milestones: string[];
  equivalence: { label: string; count: number } | null;
  blurb: string | null;
}
