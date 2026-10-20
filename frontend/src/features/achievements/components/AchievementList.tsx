"use client";
import { ActionResponse } from "@/src/lib/apiTypes";
import React, { use, useState } from "react";
import {
  ACCENTS,
  AchievementFreqTypes,
  achievementFreqTypes,
  achievementTypes,
  UserAchievement,
} from "../types";
import AchievementCard from "./AchievementCard";
import { Button } from "@/src/components/ui/button";

interface AchievementListProps {
  achievementsPromise: Promise<ActionResponse<UserAchievement[]>>;
}
const filterTypes: { text: string; type: string }[] = [
  { text: "Weight", type: achievementTypes.pr_weight },
  { text: "Reps", type: achievementTypes.pr_reps },
  { text: "Distance", type: achievementTypes.pr_distance },
  { text: "Duration", type: achievementTypes.pr_duration },
  { text: "Streak", type: "streak" },
];
export default function AchievementList({
  achievementsPromise,
}: AchievementListProps) {
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, boolean>
  >({
    pr_weight: true,
    pr_reps: true,
    pr_distance: true,
    pr_duration: true,
    streak: true,
  });
  const response = use(achievementsPromise);
  if (!response.success) {
    return (
      <div className="w-full bg-destructive/10 text-destructive border-dashed border-2 border-destructive p-4 mt-4 rounded text-center">
        <p>Sorry could not load achievements</p>
      </div>
    );
  }
  const allFiltersSelected = Object.values(selectedFilters).every(Boolean);
  const oneFilterSelected =
    Object.values(selectedFilters)
      .map(Number)
      .reduce((a, b) => a + b) === 1;

  const filteredAchievements = response.data.filter(
    (a) =>
      selectedFilters[a.achievement.type] ||
      (Object.values(achievementFreqTypes).includes(
        a.achievement.type as AchievementFreqTypes,
      ) &&
        selectedFilters["streak"]),
  );

  if (response.data.length === 0) {
    return (
      <div className=" mt-4">
        {response.data.length === 0 && (
          <div className="px-4 py-14 w-full text-center border-2 border-muted rounded-md text-secondary-foreground text-2xl">
            <p>None</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className=" mt-4">
      <div>
        <div className="flex gap-2 mb-2 flex-wrap">
          <Button
            variant="secondary"
            className={`border-l-white ${allFiltersSelected ? "" : "opacity-50"}`}
            onClick={() =>
              setSelectedFilters((prev) =>
                Object.fromEntries(
                  Object.entries(prev).map(([k]) => [k, true]),
                ),
              )
            }
          >
            All
          </Button>
          {filterTypes.map(({ text, type }) => {
            const { border } = ACCENTS[type as keyof typeof ACCENTS];
            const isSelected =
              selectedFilters[type as keyof typeof selectedFilters];

            return (
              <Button
                variant="secondary"
                className={`${border} ${isSelected ? "" : "opacity-50"}`}
                key={type}
                onClick={() =>
                  setSelectedFilters((prev) => {
                    return Object.fromEntries(
                      Object.entries(prev).map(([k, v]) =>
                        k === type ? [k, !v || oneFilterSelected] : [k, v],
                      ),
                    );
                  })
                }
              >
                {text}
              </Button>
            );
          })}
        </div>

        <div className="grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredAchievements.map((achievement) => (
            <div key={achievement.id} className="">
              <AchievementCard achievement={achievement} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
