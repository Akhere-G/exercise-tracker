export default function WorkoutsSkeleton() {
  return (
    <div className="">
      <div className="flex items-center justify-between mb-6">
        <div className="container flex items-center gap-2">
          <div className="h-5 w-5 bg-muted animate-pulse rounded" />
          <div className="h-8 w-40 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex items-center gap-2 border border-border rounded-xl p-1 bg-card">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
        </div>
      </div>

      <div className="mx-1 mb-4 border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-border bg-muted/30 text-center py-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="h-4 w-8 bg-muted animate-pulse rounded mx-auto"
            />
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-[100px] md:auto-rows-[120px]">
          {[...Array(35)].map((_, i) => (
            <div
              key={i}
              className="border-b border-r border-border/60 p-2 flex flex-col justify-between overflow-hidden relative group last:border-r-0"
            >
              <div className="h-6 w-6 bg-muted animate-pulse rounded-full self-start" />
              <div className="w-full flex flex-col gap-1">
                <div className="h-2 w-full bg-muted animate-pulse rounded-full" />
                <div className="h-2 w-3/4 bg-muted animate-pulse rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
