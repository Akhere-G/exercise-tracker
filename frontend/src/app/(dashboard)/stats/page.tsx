import Link from "next/link";
import { Suspense } from "react";
import StatsRangeSelector from "@/src/features/stats/components/StatsRangeSelector";
import StatsSkeleton from "@/src/features/stats/components/StatsSkeleton";
import StatsTabContent from "@/src/features/stats/components/StatsTabContent";
import StatsTabs from "@/src/features/stats/components/StatsTabs";
import {
  parseExerciseIds,
  parseGranularity,
  parseStatsRange,
  parseStatsTab,
} from "@/src/features/stats/utils";

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const range = parseStatsRange(params.range);
  const tab = parseStatsTab(params.tab);
  const granularity = parseGranularity(params.granularity);
  const exerciseIds = parseExerciseIds(params.ids);
  const usesRange = tab === "overview" || tab === "compare";

  return (
    <div className="flex justify-center w-screen">
      <div className="container">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-2xl">Stats</h2>
          <div className="flex gap-4 text-sm">
            <Link href="/wrapped" className="underline">
              Wrapped
            </Link>
            <Link href="/body" className="underline">
              Body weight
            </Link>
          </div>
        </div>
        <StatsTabs active={tab} range={range} />
        {usesRange && (
          <div className="mt-4">
            <StatsRangeSelector active={range} tab={tab} />
          </div>
        )}
        <Suspense
          key={`${tab}-${range}-${granularity}-${exerciseIds.join(",")}`}
          fallback={<StatsSkeleton />}
        >
          <StatsTabContent
            tab={tab}
            range={range}
            granularity={granularity}
            exerciseIds={exerciseIds}
          />
        </Suspense>
      </div>
    </div>
  );
}
