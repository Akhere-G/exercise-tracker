import { Suspense } from "react";
import StatsRangeSelector from "@/src/features/stats/components/StatsRangeSelector";
import StatsSkeleton from "@/src/features/stats/components/StatsSkeleton";
import StatsView from "@/src/features/stats/components/StatsView";
import { getStats } from "@/src/features/stats/queries";
import { parseStatsRange } from "@/src/features/stats/utils";

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const range = parseStatsRange((await searchParams).range);
  const statsPromise = getStats(range);

  return (
    <div className="flex justify-center w-screen">
      <div className="container">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-2xl">Stats</h2>
          <StatsRangeSelector active={range} />
        </div>
        <Suspense key={range} fallback={<StatsSkeleton />}>
          <StatsView statsPromise={statsPromise} />
        </Suspense>
      </div>
    </div>
  );
}
