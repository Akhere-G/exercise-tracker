import BodyChart from "@/src/app/(dashboard)/workouts/summary/[workoutId]/components/BodyChart";
import { MuscleVolume } from "../types";
import {
  formatWeekLabel,
  getVolumeBodyData,
  RECOMMENDED_WEEKLY_SETS,
  titleCase,
} from "../utils";

const { min, max } = RECOMMENDED_WEEKLY_SETS;

export default function MuscleVolumeView({ volume }: { volume: MuscleVolume }) {
  const data = getVolumeBodyData(volume);
  const scale = Math.max(max + 4, ...volume.groups.map((g) => g.thisWeekSets));
  const percent = (sets: number) => `${Math.min((sets / scale) * 100, 100)}%`;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="text-xl">Weekly sets per muscle</h3>
        <p className="text-sm text-muted-foreground">
          This week, counting secondary muscles as half a set. The shaded band is{" "}
          {min}–{max} sets a week, a common range for building muscle.
        </p>
      </div>

      <div className="flex justify-center">
        <BodyChart data={data} side="front" />
        <BodyChart data={data} side="back" />
      </div>

      <ul className="flex flex-col gap-3">
        {volume.groups.map((group) => (
          <li key={group.group}>
            <div className="flex justify-between text-sm mb-1">
              <span>{titleCase(group.group)}</span>
              <span className="text-muted-foreground">
                {group.thisWeekSets} sets
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="absolute inset-y-0 bg-primary/25"
                style={{ left: percent(min), width: `calc(${percent(max)} - ${percent(min)})` }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-primary"
                style={{ width: percent(group.thisWeekSets) }}
              />
            </div>
            <div className="mt-1 flex gap-0.5" aria-hidden>
              {group.sets.map((sets, i) => (
                <div
                  key={volume.weeks[i]}
                  title={`${formatWeekLabel(volume.weeks[i])}: ${sets} sets`}
                  className="h-3 flex-1 rounded-sm bg-primary"
                  style={{ opacity: Math.max(0.12, Math.min(sets / max, 1)) }}
                />
              ))}
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        The small squares show each of the last {volume.weeks.length} weeks,
        oldest first.
      </p>
    </section>
  );
}
