export const STATS_RANGES = [
  { value: "7d", label: "7 days", days: 7 },
  { value: "30d", label: "30 days", days: 30 },
  { value: "90d", label: "90 days", days: 90 },
  { value: "all", label: "All time", days: null },
] as const;

export type StatsRange = (typeof STATS_RANGES)[number]["value"];

export const DEFAULT_STATS_RANGE: StatsRange = "30d";

export interface StatsOverview {
  workoutCount: number;
  totalSets: number;
  totalVolume: number;
  totalDistanceMeters: number;
  totalDurationSecs: number;
  averageDurationSecs: number;
  activeDays: number;
  weeklyStreak: number;
}

export interface WeeklyTrend {
  weekStart: string;
  workoutCount: number;
  totalVolume: number;
  totalDurationSecs: number;
}

export interface MuscleStat {
  name: string;
  primarySets: number;
  secondarySets: number;
}

export interface TopExercise {
  id: number;
  name: string;
  setCount: number;
  workoutCount: number;
  lastUsed: string | null;
}

export interface PersonalRecord {
  id: number;
  type: string;
  value: number;
  exerciseId: number;
  exerciseName: string;
  unlockedAt: string;
}

export interface Stats {
  overview: StatsOverview;
  trends: WeeklyTrend[];
  muscles: MuscleStat[];
  topExercises: TopExercise[];
  personalRecords: PersonalRecord[];
}

export type TrendMetric = "workouts" | "volume" | "minutes";
