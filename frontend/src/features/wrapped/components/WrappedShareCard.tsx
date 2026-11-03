import { forwardRef } from "react";
import ShareCard from "@/src/features/share/components/ShareCard";
import { formatWeight, WeightUnit } from "@/src/lib/units";
import { THEMES } from "../themes";
import { Wrapped, WrappedTheme } from "../types";

interface WrappedShareCardProps {
  wrapped: Wrapped;
  theme: WrappedTheme;
  unit: WeightUnit;
  title: string;
}

const WrappedShareCard = forwardRef<HTMLDivElement, WrappedShareCardProps>(
  function WrappedShareCard({ wrapped, theme, unit, title }, ref) {
    const copy = THEMES[theme];
    const stats = [
      { label: "Workouts", value: String(wrapped.workoutCount) },
      { label: "Volume", value: formatWeight(wrapped.totalVolume, unit) },
      { label: "Records", value: String(wrapped.prCount) },
      { label: "Best streak", value: `${wrapped.longestStreakDays} days` },
    ];

    return (
      <ShareCard
        ref={ref}
        title={`${copy.emoji} ${title}`}
        subtitle={wrapped.topExercise?.name}
      >
        <div className="grid grid-cols-2 gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg bg-muted p-3"
              style={{ borderLeft: `4px solid ${copy.accent}` }}
            >
              <p className="text-lg font-bold leading-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </ShareCard>
    );
  },
);

export default WrappedShareCard;
