export default function ActiveWorkoutSkeleton() {
  return (
    <div className="relative h-[90vh] flex flex-1 flex-col justify-between">
      <div>
        <div className="h-16 w-full bg-muted animate-pulse rounded mb-4" />
        <div className="h-48 w-full bg-muted animate-pulse rounded mb-4" />
        <div className="h-64 w-full bg-muted animate-pulse rounded mb-4" />
        <div className="h-32 w-full bg-muted animate-pulse rounded" />
      </div>
      <div className="h-20 w-full bg-muted animate-pulse rounded" />

      <div className="fixed left-0 w-full px-4 bottom-32 opacity-100">
        <div className="h-10 w-full bg-muted animate-pulse rounded shadow-2xl" />
      </div>
    </div>
  );
}
