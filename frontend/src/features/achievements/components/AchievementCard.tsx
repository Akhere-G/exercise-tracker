import React from "react";
import { Trophy } from "lucide-react";
import {
  AchievementTypes,
  UserAchievement,
  ACCENTS,
  ICONS,
  isMilestone,
} from "../types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/card";
import { PR_TYPES } from "../../exercises/types";
import AchievementValue from "./AchievementValue";

function getAccent(type: string) {
  if (type in ACCENTS) {
    return ACCENTS[type as keyof typeof ACCENTS];
  }
  return isMilestone(type) ? ACCENTS.milestone : ACCENTS.streak;
}

export default function AchievementCard({
  achievement,
}: {
  achievement: UserAchievement;
}) {
  const { value, achievement: details, exercise } = achievement;
  const { name, criteria, type, icon } = details;

  const isPr = PR_TYPES.includes(type);
  const milestone = isMilestone(type);
  const title = isPr ? `New ${name}` : milestone ? name : "New Streak";
  const chip = isPr
    ? exercise?.name
    : milestone
      ? undefined
      : `${type.replace("freq_streak_", "")}× a week`;
  const Icon = ICONS[icon] ?? Trophy;
  const accent = getAccent(type);

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
        {!milestone && (
          <p className="text-3xl font-bold tabular-nums tracking-tight">
            <AchievementValue value={value} type={type as AchievementTypes} />
          </p>
        )}
        {chip && (
          <span className="truncate rounded-full bg-muted px-2.5 py-1 text-sm font-medium text-muted-foreground">
            {chip}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
