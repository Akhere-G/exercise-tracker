import { Card } from "@/src/components/card";

export default function RoutinesSkeleton() {
  return (
    <div className="container flex flex-col gap-4">
      <div className="h-8 w-24 bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-2 justify-between w-full mb-4">
              <div className="h-5 w-32 bg-muted animate-pulse rounded" />
              <div className="h-6 w-6 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="w-17 h-12 bg-muted animate-pulse rounded-md"
                />
              ))}
            </div>
            <div className="h-8 w-full bg-muted animate-pulse rounded" />
          </Card>
        ))}
      </div>
      <div className="h-10 w-full bg-muted animate-pulse rounded" />
      <div className="h-4 w-32 bg-muted animate-pulse rounded mx-auto" />
      <div className="h-20 w-full bg-muted animate-pulse rounded" />
    </div>
  );
}
