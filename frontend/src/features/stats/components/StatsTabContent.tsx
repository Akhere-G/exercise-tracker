import { getStats } from "../queries";
import {
  getConsistency,
  getExerciseComparison,
  getMuscleVolume,
  getPeriodComparison,
  getRecovery,
  getStrengthStandards,
} from "../queries";
import { Granularity, STATS_RANGES, StatsRange, StatsTab } from "../types";
import ConsistencyView from "./ConsistencyView";
import ExerciseCompare from "./ExerciseCompare";
import MuscleVolumeView from "./MuscleVolumeView";
import PeriodCompare from "./PeriodCompare";
import RecoveryView from "./RecoveryView";
import StatsView from "./StatsView";
import StrengthStandardsView from "./StrengthStandardsView";

const Failed = ({ what }: { what: string }) => (
  <div className="w-full bg-destructive/10 text-destructive border-dashed border-2 border-destructive p-4 mt-4 rounded text-center">
    <p>Sorry could not load {what}</p>
  </div>
);

export default async function StatsTabContent({
  tab,
  range,
  granularity,
  exerciseIds,
}: {
  tab: StatsTab;
  range: StatsRange;
  granularity: Granularity;
  exerciseIds: number[];
}) {
  switch (tab) {
    case "muscles": {
      const [volume, recovery] = await Promise.all([
        getMuscleVolume(),
        getRecovery(),
      ]);
      return (
        <div className="mt-4 flex flex-col gap-10 pb-8">
          {volume.success ? <MuscleVolumeView volume={volume.data} /> : <Failed what="muscle volume" />}
          {recovery.success ? <RecoveryView recovery={recovery.data} /> : <Failed what="recovery" />}
        </div>
      );
    }
    case "strength": {
      const standards = await getStrengthStandards();
      return (
        <div className="mt-4 pb-8">
          {standards.success ? (
            <StrengthStandardsView standards={standards.data} />
          ) : (
            <Failed what="strength levels" />
          )}
        </div>
      );
    }
    case "consistency": {
      const consistency = await getConsistency();
      return (
        <div className="mt-4 pb-8">
          {consistency.success ? (
            <ConsistencyView data={consistency.data} />
          ) : (
            <Failed what="consistency" />
          )}
        </div>
      );
    }
    case "compare": {
      const [series, comparison] = await Promise.all([
        exerciseIds.length > 0
          ? getExerciseComparison(exerciseIds, range)
          : Promise.resolve({ success: true as const, data: [] }),
        getPeriodComparison(range),
      ]);
      const label = STATS_RANGES.find((r) => r.value === range)?.label ?? "";
      return (
        <div className="mt-4 flex flex-col gap-10 pb-8">
          {series.success ? (
            <ExerciseCompare series={series.data} range={range} />
          ) : (
            <Failed what="the exercise comparison" />
          )}
          {comparison === null ? (
            <p className="text-sm text-muted-foreground">
              Choose a time range other than All time to compare periods.
            </p>
          ) : comparison.success ? (
            <PeriodCompare comparison={comparison.data} label={label} />
          ) : (
            <Failed what="the period comparison" />
          )}
        </div>
      );
    }
    default:
      return (
        <StatsView
          statsPromise={getStats(range, granularity)}
          comparisonPromise={getPeriodComparison(range)}
          range={range}
          granularity={granularity}
        />
      );
  }
}
