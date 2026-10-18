import React from "react";
import { Trophy } from "lucide-react";
import {
  achievementFreqTypes,
  achievementTypes,
  AchievementTypes,
  UserAchievement,
  ACCENTS,
  ICONS,
} from "../types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/card";
import { PR_TYPES } from "../../exercises/types";

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
      className={`overflow-hidden border-l-4 w-full h-full flex flex-col justify-between ${accent.border}`}
    >
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-3 ">
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
      <CardContent className="flex items-end justify-between gap-3 ">
        <p className="text-3xl font-bold tabular-nums tracking-tight">
          {formatValue(value, type as AchievementTypes)}
        </p>
        {chip && (
          <span className="truncate rounded-full bg-muted px-2.5 py-1 text-sm font-medium text-muted-foreground">
            {chip}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
