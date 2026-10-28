import BodyChart from "@/src/app/(dashboard)/workouts/summary/[workoutId]/components/BodyChart";
import { MuscleStat } from "../types";
import { getMuscleChartData } from "../utils";

export default function MuscleBreakdown({ muscles }: { muscles: MuscleStat[] }) {
  if (muscles.length === 0) return null;

  const data = getMuscleChartData(muscles);
  const maxSets = Math.max(...muscles.map((m) => m.primarySets + m.secondarySets));

  return (
    <section>
      <h3 className="text-xl mb-4">Muscles worked</h3>
      <div className="flex justify-center">
        <BodyChart data={data} side="front" />
        <BodyChart data={data} side="back" />
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {muscles.map((muscle) => {
          const total = muscle.primarySets + muscle.secondarySets;
          return (
            <li key={muscle.name}>
              <div className="flex justify-between text-sm mb-1">
                <span>{muscle.name}</span>
                <span className="text-muted-foreground">
                  {total} {total === 1 ? "set" : "sets"}
                  {muscle.secondarySets > 0 &&
                    ` (${muscle.secondarySets} secondary)`}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(total / maxSets) * 100}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
