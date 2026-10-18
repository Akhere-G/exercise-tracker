import { Weight } from "lucide-react";
import AchievementSkeleton from "../../achievements/components/AchievementSkeleton";

export default function WorkoutSummarySkeleton() {
  return (
    <div className="flex w-screen justify-center">
      <div className="container animate-pulse">
        <div className="mb-5 flex items-center justify-between">
          <div className="h-15 w-48 rounded bg-muted " />
        </div>

        <div className="flex gap-4 flex-wrap mb-6">
          {Array(3)
            .fill(1)
            .map((a, i) => (
              <div
                key={i}
                className="flex-1 min-w-30 bg-card border border-muted  rounded-xl p-4"
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="flex gap-2 items-center">
                    <Weight size={20} />
                    <p className="bg-muted rounded-sm w-10 h-5" />
                  </div>
                  <div className="bg-muted rounded-sm w-13 h-4" />
                </div>
              </div>
            ))}
        </div>

        <div className="flex justify-center gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-72 w-40 rounded-lg bg-card border border-muted sm:w-48"
            />
          ))}
        </div>

        <div className="mt-6">
          <div className="mb-4 h-8 w-32 rounded bg-caed" />

          <div className="mb-4 flex flex-wrap gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-1 items-center gap-3 rounded-lg border bg-card border border-muted border-muted p-4"
              >
                <div className="w-17 h-12 shrink-0 rounded-md bg-muted" />
                <div className="flex flex-col gap-2">
                  <div className="h-6 w-45 rounded bg-muted" />
                  <div className="flex gap-4">
                    <div className="h-4 w-16 rounded bg-muted" />
                    <div className="h-4 w-16 rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <AchievementSkeleton />
      </div>
    </div>
  );
}
