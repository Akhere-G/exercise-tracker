import { ActionResponse } from "@/src/lib/apiTypes";
import React, { use } from "react";
import { UserAchievement } from "../type";
import AchievementCard from "./AchievementCard";

interface AchievementListProps {
  achievementsPromise: Promise<ActionResponse<UserAchievement[]>>;
}

export default function AchievementList({
  achievementsPromise,
}: AchievementListProps) {
  const response = use(achievementsPromise);
  if (!response.success) {
    return (
      <div className="w-full bg-destructive/10 text-destructive border-dashed border-2 border-destructive p-4 mt-4 rounded text-center">
        <p>Sorry could not load achievements</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 flex-wrap mt-4">
      {response.data.map((achievement) => (
        <AchievementCard key={achievement.id} achievement={achievement} />
      ))}
    </div>
  );
}
