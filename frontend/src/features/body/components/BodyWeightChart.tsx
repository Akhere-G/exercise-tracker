"use client";
import { Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@/src/components/card";
import { useWeightUnit } from "@/src/features/profile/components/ProfileProvider";
import { toDisplayWeight } from "@/src/lib/units";
import { BodyWeight } from "../types";

export default function BodyWeightChart({ weights }: { weights: BodyWeight[] }) {
  const unit = useWeightUnit();
  const data = [...weights]
    .sort((a, b) => a.measuredOn.localeCompare(b.measuredOn))
    .map((w) => ({
      x: new Date(`${w.measuredOn}T00:00:00`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      y: toDisplayWeight(w.weightKg, unit),
    }));

  if (data.length < 2) {
    return (
      <Card>
        <CardContent>
          <p className="p-4 text-center">
            Log at least two weigh-ins to see your trend.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <LineChart
      style={{
        width: "100%",
        maxWidth: "700px",
        height: "100%",
        maxHeight: "70vh",
        aspectRatio: 1.618,
      }}
      responsive
      data={data}
      margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
    >
      <XAxis dataKey="x" stroke="var(--color-secondary-foreground)" />
      <YAxis
        width="auto"
        domain={["dataMin - 1", "dataMax + 1"]}
        stroke="var(--color-secondary-foreground)"
      />
      <Tooltip
        formatter={(value) => [`${value} ${unit}`, ""]}
        separator=""
        contentStyle={{
          backgroundColor: "var(--color-card, #fff)",
          borderColor: "var(--color-border, #e2e8f0)",
          borderRadius: "0.5rem",
        }}
        itemStyle={{ color: "var(--color-foreground)" }}
        labelStyle={{ color: "var(--color-muted-foreground)" }}
      />
      <Line
        dataKey="y"
        stroke="var(--color-primary)"
        strokeWidth={2}
        dot={{ r: 3 }}
      />
    </LineChart>
  );
}
