import { getUserAchievements } from "@/src/features/achievements/actions";
import AchievementList from "@/src/features/achievements/components/AchievementList";
import AchievementSkeleton from "@/src/features/achievements/components/AchievementSkeleton";
import React, { Suspense } from "react";

export default function page() {
  const achievementsPromise = getUserAchievements();

  return (
    <div className="flex justify-center w-screen">
      <Suspense fallback={<AchievementSkeleton />}>
        <div className="container">
          <h2 className="text-2xl">Achievements</h2>
          <AchievementList achievementsPromise={achievementsPromise} />
        </div>
      </Suspense>
    </div>
  );
}
