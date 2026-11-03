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

export const STATS_TABS = [
  { value: "overview", label: "Overview" },
  { value: "muscles", label: "Muscles" },
  { value: "strength", label: "Strength" },
  { value: "consistency", label: "Consistency" },
  { value: "compare", label: "Compare" },
] as const;

export type StatsTab = (typeof STATS_TABS)[number]["value"];

export type Granularity = "week" | "month";

export interface MuscleGroupVolume {
  group: string;
  sets: number[];
  volume: number[];
  thisWeekSets: number;
}

export interface MuscleVolume {
  weeks: string[];
  groups: MuscleGroupVolume[];
}

export type RecoveryStatus = "fresh" | "recovering" | "fatigued";

export interface MuscleRecovery {
  group: string;
  fatigue: number;
  status: RecoveryStatus;
  hoursSinceTrained: number | null;
}

export interface StrengthStandard {
  key: string;
  name: string;
  exerciseId: number | null;
  estimatedOneRepMax: number | null;
  ratio: number | null;
  level: string | null;
  nextLevel: string | null;
  progress: number | null;
  kgToNext: number | null;
}

export interface StrengthStandards {
  bodyWeightKg: number | null;
  lifts: StrengthStandard[];
}

export interface HeatmapDay {
  day: string;
  count: number;
}

export interface Consistency {
  year: number;
  totalWorkouts: number;
  activeDays: number;
  averagePerWeek: number;
  bestWeekCount: number;
  longestWeeklyStreak: number;
  currentWeeklyStreak: number;
  bestMonth: number | null;
  bestMonthCount: number;
  weekdayCounts: number[];
  heatmap: HeatmapDay[];
}

export interface DeltaValue {
  change: number;
  percent: number | null;
}

export interface PeriodComparison {
  current: StatsOverview;
  previous: StatsOverview;
  deltas: Record<string, DeltaValue>;
}

export interface ExerciseSession {
  day: string;
  estimatedOneRepMax: number | null;
  topWeight: number | null;
  volume: number;
}

export interface ExerciseSeries {
  exerciseId: number;
  name: string;
  sessions: ExerciseSession[];
}
