import React from "react";
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
import {
  achievementFreqTypes,
  achievementTypes,
  AchievementTypes,
  UserAchievement,
} from "../type";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/card";
import { PR_TYPES } from "../../exercises/types";

const ICONS: Record<string, LucideIcon> = {
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

const ACCENTS = {
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

function getAccent(type: string) {
  if (type in ACCENTS) {
    return ACCENTS[type as keyof typeof ACCENTS];
  }
  return ACCENTS.streak;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatValue(value: number, type: AchievementTypes) {
  if (type in achievementFreqTypes) {
    return `${value} ${value === 1 ? "week" : "weeks"}`;
  }

  switch (type) {
    case achievementTypes.pr_weight:
      return `${formatNumber(value)} kg`;
    case achievementTypes.pr_reps:
      return `${value} ${value === 1 ? "rep" : "reps"}`;
    case achievementTypes.pr_distance:
      return `${formatNumber(value / 1000)} km`;
    case achievementTypes.pr_duration:
      return `${formatNumber(value / 60)} mins`;
    default:
      return String(value);
  }
}

export default function AchievementCard({
  achievement,
}: {
  achievement: UserAchievement;
}) {
  const { value, achievement: details, exercise } = achievement;
  const { name, criteria, type, icon } = details;

  const isPr = PR_TYPES.includes(type);
  const title = isPr ? `New ${name}` : "New Streak";
  const chip = isPr
    ? exercise?.name
    : `${type.replace("freq_streak_", "")}× a week`;
  const Icon = ICONS[icon] ?? Trophy;
  const accent = getAccent(isPr ? type : "streak");

  return (
    <Card
      className={`overflow-hidden border-l-4 min-w-[calc(50%-0.5rem)] ${accent.border}`}
    >
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${accent.badge}`}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <CardTitle className="text-base leading-tight">{title}</CardTitle>
          <CardDescription className="mt-1">{criteria}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-3">
        <p className="text-3xl font-bold tabular-nums tracking-tight">
          {formatValue(value, type as AchievementTypes)}
        </p>
        {chip && (
          <span className="max-w-[50%] truncate rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {chip}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
