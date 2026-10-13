export default function RoutineDetailsSkeleton() {
  return (
    <div>
      <div className="container">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-40 bg-muted animate-pulse rounded" />
      </div>
      <div className="container py-0 px-3">
        <div className="container bg-transparent mx-0 flex gap-2">
          <div className="h-10 w-20 bg-muted animate-pulse rounded" />
          <div className="h-10 w-20 bg-muted animate-pulse rounded" />
          <div className="h-10 w-20 bg-muted animate-pulse rounded" />
        </div>
      </div>
      <div className="container mt-4">
        <div className="h-64 w-full bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}
