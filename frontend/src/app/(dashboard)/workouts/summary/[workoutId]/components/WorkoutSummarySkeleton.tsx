export default function WorkoutSummarySkeleton() {
  return (
    <div className="flex justify-center w-screen">
      <div className="container">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="h-8 w-full bg-muted animate-pulse rounded mb-4" />
        <div className="flex gap-4 flex-wrap">
          <div className="h-20 w-32 bg-muted animate-pulse rounded" />
          <div className="h-20 w-32 bg-muted animate-pulse rounded" />
          <div className="h-20 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <div className="h-48 w-32 bg-muted animate-pulse rounded" />
          <div className="h-48 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-8 w-24 bg-muted animate-pulse rounded mt-4" />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 w-full bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
