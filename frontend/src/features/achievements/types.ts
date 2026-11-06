import { ExerciseNoMuscles } from "../exercises/types";
import {
  Award,
  Cake,
  Calendar,
  CalendarCheck,
  CalendarDays,
  Compass,
  Crown,
  Dumbbell,
  Flag,
  Flame,
  Focus,
  Gauge,
  Hourglass,
  Medal,
  Moon,
  MoonStar,
  Mountain,
  PartyPopper,
  Repeat,
  Repeat2,
  Route,
  Shapes,
  Shield,
  Sparkles,
  Sprout,
  Sun,
  Sunrise,
  Swords,
  Tally5,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Users,
  Weight,
  Zap,
  type LucideIcon,
} from "lucide-react";
export interface Achievement {
  id: number;
  name: string;
  description: string;
  type: string;
  icon: string;
  criteria: string;
  priority: number;
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

const MILESTONE_PREFIXES = [
  "first_workout",
  "workouts_",
  "century",
  "back_to_back",
  "three_peat",
  "five_day_fire",
  "weekly_warrior",
  "monthly_regular",
  "four_week_focus",
  "two_month_club",
  "weekend_warrior",
  "early_riser",
  "early_bird",
  "lunch_break_lifter",
  "night_owl",
  "midnight_oil",
  "speed_demon",
  "marathon_session",
  "heavy_hitter",
  "ton_up",
  "volume_monster",
  "triple_threat",
  "record_breaker",
  "variety_",
  "new_year_new_gains",
  "first_anniversary",
];

export const isMilestone = (type: string) =>
  MILESTONE_PREFIXES.some((prefix) => type.startsWith(prefix));

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
  flag: Flag,
  repeat: Repeat,
  sunrise: Sunrise,
  moon: Moon,
  swords: Swords,
  "party-popper": PartyPopper,
  hourglass: Hourglass,
  weight: Weight,
  shapes: Shapes,
  sprout: Sprout,
  dumbbell: Dumbbell,
  target: Target,
  gauge: Gauge,
  shield: Shield,
  "repeat-2": Repeat2,
  "calendar-check": CalendarCheck,
  "calendar-days": CalendarDays,
  focus: Focus,
  users: Users,
  sun: Sun,
  "moon-star": MoonStar,
  zap: Zap,
  mountain: Mountain,
  "trending-up": TrendingUp,
  compass: Compass,
  sparkles: Sparkles,
  cake: Cake,
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
  milestone: {
    border: "border-l-pink-500",
    badge: "bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400",
  },
  streak: {
    border: "border-l-orange-500",
    badge:
      "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",
  },
};
