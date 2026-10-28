import StatsSkeleton from "@/src/features/stats/components/StatsSkeleton";

export default function Loading() {
  return (
    <div className="flex justify-center w-screen">
      <div className="container">
        <h2 className="text-2xl">Stats</h2>
        <StatsSkeleton />
      </div>
    </div>
  );
}
