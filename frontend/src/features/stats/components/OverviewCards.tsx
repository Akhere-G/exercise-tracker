import {
  BicepsFlexed,
  Flame,
  Hourglass,
  Layers,
  Timer,
  Weight,
} from "lucide-react";
import ExerciseStat from "@/src/app/(dashboard)/components/ExerciseStat";
import { formatDuration, formatNumber } from "../utils";
import { WeightText } from "@/src/features/profile/components/Weight";
import { StatsOverview } from "../types";

export default function OverviewCards({ overview }: { overview: StatsOverview }) {
  return (
    <div className="flex flex-wrap gap-4">
      <ExerciseStat
        Icon={BicepsFlexed}
        title={overview.workoutCount}
        subtitle="Workouts"
      />
      <ExerciseStat
        Icon={Weight}
        title={<WeightText kg={Math.round(overview.totalVolume)} />}
        subtitle="Volume"
      />
      <ExerciseStat
        Icon={Timer}
        title={formatDuration(overview.totalDurationSecs)}
        subtitle="Time trained"
      />
      <ExerciseStat
        Icon={Layers}
        title={formatNumber(overview.totalSets)}
        subtitle="Sets"
      />
      <ExerciseStat
        Icon={Hourglass}
        title={formatDuration(overview.averageDurationSecs)}
        subtitle="Avg workout"
      />
      <ExerciseStat
        Icon={Flame}
        title={overview.weeklyStreak}
        subtitle="Week streak"
      />
    </div>
  );
}
