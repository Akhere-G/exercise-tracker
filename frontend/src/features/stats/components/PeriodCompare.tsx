import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { WeightText } from "@/src/features/profile/components/Weight";
import { PeriodComparison } from "../types";
import { formatDuration, formatNumber } from "../utils";

const ROWS = [
  { key: "workoutCount", label: "Workouts", format: (v: number) => formatNumber(v) },
  { key: "totalSets", label: "Sets", format: (v: number) => formatNumber(v) },
  { key: "totalVolume", label: "Volume", kg: true },
  { key: "totalDurationSecs", label: "Time", format: (v: number) => formatDuration(v) },
  { key: "averageDurationSecs", label: "Avg workout", format: (v: number) => formatDuration(v) },
  { key: "activeDays", label: "Active days", format: (v: number) => formatNumber(v) },
] as const;

type Row = (typeof ROWS)[number];
type OverviewKey = Row["key"];

const show = (row: Row, value: number) =>
  "kg" in row ? <WeightText kg={Math.round(value)} /> : row.format(value);

export default function PeriodCompare({
  comparison,
  label,
}: {
  comparison: PeriodComparison;
  label: string;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="text-xl">This period vs the one before</h3>
        <p className="text-sm text-muted-foreground">
          The last {label} against the {label} before that.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="py-2 font-normal" />
              <th className="py-2 font-normal">Previous</th>
              <th className="py-2 font-normal">Current</th>
              <th className="py-2 font-normal">Change</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const key: OverviewKey = row.key;
              const delta = comparison.deltas[key];
              const Icon = !delta || delta.change === 0 ? Minus : delta.change > 0 ? ArrowUp : ArrowDown;
              return (
                <tr key={key} className="border-t border-border">
                  <td className="py-2">{row.label}</td>
                  <td className="py-2">{show(row, comparison.previous[key])}</td>
                  <td className="py-2 font-medium">{show(row, comparison.current[key])}</td>
                  <td className="py-2">
                    <span className="inline-flex items-center gap-1">
                      <Icon size={12} className={delta?.change > 0 ? "text-primary" : ""} />
                      {delta?.percent !== null && delta?.percent !== undefined
                        ? `${delta.percent > 0 ? "+" : ""}${delta.percent}%`
                        : "–"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
