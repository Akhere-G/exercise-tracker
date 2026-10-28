"use client";

import { useState } from "react";
import { Bar, BarChart, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@/src/components/card";
import { Button } from "@/src/components/ui/button";
import { TrendMetric, WeeklyTrend } from "../types";
import { getTrendData } from "../utils";

const METRICS: { value: TrendMetric; label: string; unit: string }[] = [
  { value: "workouts", label: "Workouts", unit: "workouts" },
  { value: "volume", label: "Volume", unit: "kg" },
  { value: "minutes", label: "Time", unit: "min" },
];

export default function TrendsChart({ trends }: { trends: WeeklyTrend[] }) {
  const [metric, setMetric] = useState<TrendMetric>("workouts");
  const { unit } = METRICS.find((m) => m.value === metric)!;
  const data = getTrendData(trends, metric);

  return (
    <section>
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <h3 className="text-xl">Weekly trends</h3>
        <div className="flex gap-2">
          {METRICS.map(({ value, label }) => (
            <Button
              key={value}
              variant={value === metric ? "default" : "secondary"}
              onClick={() => setMetric(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <Card>
          <CardContent>
            <p className="p-4 text-center">No Data</p>
          </CardContent>
        </Card>
      ) : (
        <BarChart
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
            allowDecimals={false}
            stroke="var(--color-secondary-foreground)"
          />
          <Tooltip
            cursor={{ fill: "var(--color-muted)" }}
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
          <Bar dataKey="y" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      )}
    </section>
  );
}
