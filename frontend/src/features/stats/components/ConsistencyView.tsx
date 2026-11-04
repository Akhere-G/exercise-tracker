import { Consistency } from "../types";
import { monthName } from "../utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Columns of weeks, Monday first, covering the whole year. */
function buildGrid(year: number, counts: Map<string, number>) {
  const first = new Date(year, 0, 1);
  const offset = (first.getDay() + 6) % 7;
  const cells: { day: string | null; count: number }[] = Array.from(
    { length: offset },
    () => ({ day: null, count: 0 }),
  );
  for (let d = new Date(first); d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
    const day = toIso(d);
    cells.push({ day, count: counts.get(day) ?? 0 });
  }
  const weeks: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export default function ConsistencyView({ data }: { data: Consistency }) {
  const counts = new Map(data.heatmap.map((h) => [h.day, h.count]));
  const weeks = buildGrid(data.year, counts);
  const maxWeekday = Math.max(1, ...data.weekdayCounts);

  return (
    <section className="flex flex-col gap-6">
      <h3 className="text-xl">{data.year} consistency</h3>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Workouts" value={data.totalWorkouts} />
        <Stat label="Active days" value={data.activeDays} />
        <Stat label="Avg per week" value={data.averagePerWeek} />
        <Stat label="Best week" value={data.bestWeekCount} />
        <Stat
          label="Longest streak (weeks)"
          value={data.longestWeeklyStreak}
        />
        <Stat
          label="Best month"
          value={
            data.bestMonth
              ? `${monthName(data.bestMonth)} (${data.bestMonthCount})`
              : "–"
          }
        />
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-[3px] min-w-max" role="img" aria-label="Workout calendar for the year">
          {weeks.map((week, i) => (
            <div key={i} className="flex flex-col gap-[3px]">
              {week.map((cell, j) => (
                <div
                  key={j}
                  title={cell.day ? `${cell.day}: ${cell.count}` : undefined}
                  className={`h-3 w-3 rounded-sm ${cell.day ? "bg-muted" : ""}`}
                >
                  {cell.count > 0 && (
                    <div
                      className="h-full w-full rounded-sm bg-primary"
                      style={{ opacity: cell.count > 1 ? 1 : 0.6 }}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 font-medium">Busiest days</h4>
        <ul className="flex flex-col gap-2">
          {WEEKDAYS.map((label, i) => (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span className="w-8">{label}</span>
              <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(data.weekdayCounts[i] / maxWeekday) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-muted-foreground">
                {data.weekdayCounts[i]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
