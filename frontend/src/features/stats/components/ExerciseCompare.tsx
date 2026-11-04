"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { getAllExercises } from "@/src/features/exercises/actions";
import { RankedExercise } from "@/src/features/exercises/types";
import { useWeightUnit } from "@/src/features/profile/components/ProfileProvider";
import { toDisplayWeight } from "@/src/lib/units";
import { ExerciseSeries, ExerciseSession, StatsRange } from "../types";
import { formatWeekLabel } from "../utils";

const METRICS = [
  { value: "estimatedOneRepMax", label: "Est. 1RM" },
  { value: "topWeight", label: "Top weight" },
  { value: "volume", label: "Volume" },
] as const;

type Metric = (typeof METRICS)[number]["value"];
const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
];
const MAX_EXERCISES = 3;

export default function ExerciseCompare({
  series,
  range,
}: {
  series: ExerciseSeries[];
  range: StatsRange;
}) {
  const router = useRouter();
  const unit = useWeightUnit();
  const [metric, setMetric] = useState<Metric>("estimatedOneRepMax");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RankedExercise[]>([]);

  const go = (ids: number[]) =>
    router.push(`/stats?tab=compare&range=${range}&ids=${ids.join(",")}`);
  const selectedIds = series.map((s) => s.exerciseId);

  const search = async (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) return setResults([]);
    try {
      setResults((await getAllExercises({ search: value.trim() })).slice(0, 6));
    } catch {
      setResults([]);
    }
  };

  const read = (session: ExerciseSession) => {
    const value = session[metric];
    return value === null ? null : toDisplayWeight(value, unit);
  };

  const days = [...new Set(series.flatMap((s) => s.sessions.map((x) => x.day)))].sort();
  const data = days.map((day) => ({
    x: formatWeekLabel(day),
    ...Object.fromEntries(
      series.map((s) => {
        const session = s.sessions.find((x) => x.day === day);
        return [`s${s.exerciseId}`, session ? read(session) : null];
      }),
    ),
  }));

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-xl">Compare exercises</h3>

      <div className="flex flex-wrap gap-2">
        {series.map((s, i) => (
          <span
            key={s.exerciseId}
            className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i] }} />
            {s.name}
            <button
              aria-label={`Remove ${s.name}`}
              onClick={() => go(selectedIds.filter((id) => id !== s.exerciseId))}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      {series.length < MAX_EXERCISES && (
        <div className="relative max-w-sm">
          <Input
            placeholder="Add an exercise…"
            value={query}
            onChange={(e) => search(e.target.value)}
          />
          {results.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card p-1 shadow">
              {results
                .filter((r) => !selectedIds.includes(r.id))
                .map((r) => (
                  <li key={r.id}>
                    <button
                      className="w-full rounded px-2 py-1 text-left text-sm hover:bg-muted"
                      onClick={() => go([...selectedIds, r.id])}
                    >
                      {r.name}
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {METRICS.map((m) => (
          <Button
            key={m.value}
            variant={m.value === metric ? "default" : "secondary"}
            onClick={() => setMetric(m.value)}
          >
            {m.label}
          </Button>
        ))}
      </div>

      {data.length === 0 ? (
        <p className="rounded-lg bg-muted p-4 text-center">
          {series.length === 0
            ? "Pick up to three exercises to compare."
            : "No sets logged for these exercises in this period."}
        </p>
      ) : (
        <LineChart
          style={{ width: "100%", maxWidth: "700px", aspectRatio: 1.618 }}
          responsive
          data={data}
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <XAxis dataKey="x" stroke="var(--color-secondary-foreground)" />
          <YAxis width="auto" stroke="var(--color-secondary-foreground)" />
          <Tooltip
            formatter={(value, name) => [
              `${value}${metric === "volume" ? "" : ` ${unit}`}`,
              name,
            ]}
            contentStyle={{
              backgroundColor: "var(--color-card, #fff)",
              borderColor: "var(--color-border, #e2e8f0)",
              borderRadius: "0.5rem",
            }}
            itemStyle={{ color: "var(--color-foreground)" }}
            labelStyle={{ color: "var(--color-muted-foreground)" }}
          />
          <Legend wrapperStyle={{ color: "var(--color-foreground)" }} />
          {series.map((s, i) => (
            <Line
              key={s.exerciseId}
              dataKey={`s${s.exerciseId}`}
              name={s.name}
              stroke={COLORS[i]}
              strokeWidth={2}
              connectNulls
              dot={{ r: 4, fill: COLORS[i], stroke: COLORS[i] }}
              activeDot={{ r: 6, fill: COLORS[i], stroke: COLORS[i] }}
            />
          ))}
        </LineChart>
      )}
    </section>
  );
}
