export default function StatsSkeleton() {
  return (
    <div className="mt-4 flex flex-col gap-8">
      <div className="flex flex-wrap gap-4">
        {Array(6)
          .fill(1)
          .map((_, i) => (
            <div
              key={i}
              className="flex-1 min-w-30 h-20 rounded-xl bg-muted animate-pulse"
            />
          ))}
      </div>
      <div className="w-full max-w-175 aspect-[1.618] rounded-xl bg-muted animate-pulse" />
      <div className="w-full h-64 rounded-xl bg-muted animate-pulse" />
    </div>
  );
}
