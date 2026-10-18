import { ExerciseNoMuscles } from "../exercises/types";
import {
  Award,
  Calendar,
  Crown,
  Flame,
  Medal,
  Route,
  Tally5,
  Timer,
  Trophy,
  type LucideIcon,
} from "lucide-react";
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

export const ICONS: Record<string, LucideIcon> = {
  trophy: Trophy,
  route: Route,
  "tally-5": Tally5,
  timer: Timer,
  flame: Flame,
  calendar: Calendar,
  award: Award,
  medal: Medal,
  crown: Crown,
};

export const ACCENTS = {
  pr_weight: {
    border: "border-l-amber-500",
    badge:
      "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  },
  pr_reps: {
    border: "border-l-violet-500",
    badge:
      "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  },
  pr_distance: {
    border: "border-l-sky-500",
    badge: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
  },
  pr_duration: {
    border: "border-l-emerald-500",
    badge:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  streak: {
    border: "border-l-orange-500",
    badge:
      "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",
  },
};
