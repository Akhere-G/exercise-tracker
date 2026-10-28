"use client";

import { use } from "react";
import { ActionResponse } from "@/src/lib/apiTypes";
import { Stats } from "../types";
import MuscleBreakdown from "./MuscleBreakdown";
import OverviewCards from "./OverviewCards";
import PersonalRecords from "./PersonalRecords";
import TopExercises from "./TopExercises";
import TrendsChart from "./TrendsChart";

export default function StatsView({
  statsPromise,
}: {
  statsPromise: Promise<ActionResponse<Stats>>;
}) {
  const response = use(statsPromise);

  if (!response.success) {
    return (
      <div className="w-full bg-destructive/10 text-destructive border-dashed border-2 border-destructive p-4 mt-4 rounded text-center">
        <p>Sorry could not load stats</p>
      </div>
    );
  }

  const { overview, trends, muscles, topExercises, personalRecords } =
    response.data;

  if (overview.workoutCount === 0) {
    return (
      <div className="mt-4 flex flex-col gap-8">
        <div className="px-4 py-14 w-full text-center border-2 border-muted rounded-md text-secondary-foreground text-2xl">
          <p>No workouts in this period</p>
        </div>
        <PersonalRecords records={personalRecords} />
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-8 pb-8">
      <OverviewCards overview={overview} />
      <TrendsChart trends={trends} />
      <MuscleBreakdown muscles={muscles} />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <TopExercises exercises={topExercises} />
        <PersonalRecords records={personalRecords} />
      </div>
    </div>
  );
}
