import { ExerciseNoMuscles } from "../exercises/types";

export interface Achievement {
  id: number;
  name: string;
  description: string;
  type: string;
  icon: string;
  criteria: string;
}

export interface UserAchievement {
  id: number;
  userId: number;
  achievementId: number;
  value: number;
  exerciseId: number | null;
  workout_id: number;
  unlocked_at: string;
  achievement: Achievement;
  exercise?: ExerciseNoMuscles;
}

export const achievementFreqTypes = {
  freq_streak_1: "freq_streak_1",
  freq_streak_2: "freq_streak_2",
  freq_streak_3: "freq_streak_3",
  freq_streak_4: "freq_streak_4",
  freq_streak_5: "freq_streak_5",
} as const;

export type AchievementFreqTypes =
  (typeof achievementFreqTypes)[keyof typeof achievementFreqTypes];

export const achievementPrTypes = {
  pr_weight: "pr_weight",
  pr_distance: "pr_distance",
  pr_reps: "pr_reps",
  pr_duration: "pr_duration",
} as const;

export type AchievementPrTypes =
  (typeof achievementPrTypes)[keyof typeof achievementPrTypes];

export const achievementTypes = {
  ...achievementFreqTypes,
  ...achievementPrTypes,
} as const;

export type AchievementTypes =
  (typeof achievementTypes)[keyof typeof achievementTypes];

export const FrequencyIcons = {
  1: "flame",
  2: "calendar",
  3: "award",
  4: "medal",
  5: "crown",
} as const;
