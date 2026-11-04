"use client";
import { use } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { ActionResponse } from "@/src/lib/apiTypes";
import { DeltaValue, PeriodComparison } from "../types";
import { formatSignedCount, formatSignedDuration } from "../utils";

const FIELDS = [
  { key: "workoutCount", label: "Workouts" },
  { key: "totalSets", label: "Sets" },
  { key: "totalVolume", label: "Volume" },
  { key: "totalDurationSecs", label: "Time" },
] as const;

const formatChange = (key: (typeof FIELDS)[number]["key"], delta: DeltaValue) => {
  if (key === "totalDurationSecs") return formatSignedDuration(delta.change);
  if (key === "totalVolume")
    return delta.percent === null ? "–" : `${delta.percent > 0 ? "+" : ""}${delta.percent}%`;
  return formatSignedCount(delta.change);
};

export default function PeriodDeltas({
  comparisonPromise,
}: {
  comparisonPromise: Promise<ActionResponse<PeriodComparison> | null>;
}) {
  const response = use(comparisonPromise);
  if (!response?.success) return null;

  return (
    <div className="flex flex-wrap gap-2 text-sm">
      <span className="text-muted-foreground">vs previous period:</span>
      {FIELDS.map(({ key, label }) => {
        const delta = response.data.deltas[key];
        if (!delta) return null;
        const Icon = delta.change > 0 ? ArrowUp : delta.change < 0 ? ArrowDown : Minus;
        return (
          <span
            key={key}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5"
          >
            <Icon size={12} className={delta.change > 0 ? "text-primary" : ""} />
            {label}
            {` ${formatChange(key, delta)}`}
          </span>
        );
      })}
    </div>
  );
}
