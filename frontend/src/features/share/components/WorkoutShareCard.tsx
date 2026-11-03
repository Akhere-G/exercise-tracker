import { forwardRef } from "react";
import ShareCard from "./ShareCard";

export interface WorkoutShareData {
  date: string;
  duration: string;
  volume: string;
  sets: number;
  topLifts: { name: string; best: string }[];
}

const WorkoutShareCard = forwardRef<HTMLDivElement, { data: WorkoutShareData }>(
  function WorkoutShareCard({ data }, ref) {
    const stats = [
      { label: "Volume", value: data.volume },
      { label: "Time", value: data.duration },
      { label: "Sets", value: String(data.sets) },
    ];

    return (
      <ShareCard ref={ref} title="Workout complete" subtitle={data.date}>
        <div className="grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg bg-muted p-3">
              <p className="text-lg font-bold leading-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <ul className="space-y-2">
          {data.topLifts.map((lift) => (
            <li key={lift.name} className="flex justify-between gap-2 text-sm">
              <span className="truncate">{lift.name}</span>
              <span className="font-semibold">{lift.best}</span>
            </li>
          ))}
        </ul>
      </ShareCard>
    );
  },
);

export default WorkoutShareCard;
