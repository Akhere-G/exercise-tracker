import { Exercise } from "@/src/features/exercises/types";

import { workoutSetWithDate } from "@/src/features/workout/types";

import AchievementList from "@/src/features/achievements/components/AchievementList";
import { ActionResponse } from "@/src/lib/apiTypes";
import { UserAchievement } from "@/src/features/achievements/types";
import { Suspense } from "react";
import AchievementSkeleton from "@/src/features/achievements/components/AchievementSkeleton";

export default function ExerciseAchievements({
  achievementsPromise,
}: {
  exercise: Exercise;
  groupedSets: Record<string, workoutSetWithDate[]>;
  achievementsPromise: Promise<ActionResponse<UserAchievement[]>>;
}) {
  return (
    <div className="container p-0.5">
      <Suspense fallback={<AchievementSkeleton />}>
        <AchievementList achievementsPromise={achievementsPromise} />
      </Suspense>
    </div>
  );
}
