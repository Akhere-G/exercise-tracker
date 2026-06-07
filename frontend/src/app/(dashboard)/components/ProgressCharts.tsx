import { Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

export default function ProgressChart({
  data,
  title,
}: {
  data: { x: number | string; y: number | string }[];
  title: string;
}) {
  return (
    <div>
      <h2 className="text-xl mb-4">{title}</h2>

      <LineChart
        style={{
          width: "100%",
          maxWidth: "700px",
          height: "100%",
          maxHeight: "70vh",
          aspectRatio: 1.618,
          stroke: "var(--color-secondary-foreground)",
        }}
        responsive
        data={data}
        margin={{
          top: 5,
          right: 5,
          left: 0,
          bottom: 5,
        }}
      >
        <XAxis dataKey="x" stroke="var(--color-secondary-foreground)" />
        <YAxis
          dataKey="y"
          width="auto"
          stroke="var(--color-secondary-foreground)"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-card, #fff)",
            borderColor: "var(--color-border, #e2e8f0)",
            borderRadius: "0.5rem",
          }}
          itemStyle={{ color: "var(--color-foreground)" }}
          labelStyle={{ color: "var(--color-muted-foreground)" }}
        />
        <Line type="monotone" dataKey="y" stroke="var(--color-primary)" />
      </LineChart>
    </div>
  );
}
