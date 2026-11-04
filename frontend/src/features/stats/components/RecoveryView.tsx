import BodyChart from "@/src/app/(dashboard)/workouts/summary/[workoutId]/components/BodyChart";
import { MuscleRecovery } from "../types";
import { getRecoveryBodyData, RECOVERY_COLORS, titleCase } from "../utils";

const STATUS_LABEL = {
  fresh: "Fresh",
  recovering: "Recovering",
  fatigued: "Fatigued",
} as const;

const formatSince = (hours: number | null) => {
  if (hours === null) return "Not trained this week";
  return hours < 48 ? `${Math.round(hours)}h ago` : `${Math.round(hours / 24)}d ago`;
};

export default function RecoveryView({ recovery }: { recovery: MuscleRecovery[] }) {
  const data = getRecoveryBodyData(recovery);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="text-xl">Recovery</h3>
        <p className="text-sm text-muted-foreground">
          An estimate from your sets in the last 7 days. Bigger muscles take
          longer to recover.
        </p>
      </div>
      <div className="flex justify-center">
        <BodyChart data={data} side="front" />
        <BodyChart data={data} side="back" />
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {recovery.map((r) => (
          <li
            key={r.group}
            className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm"
          >
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: RECOVERY_COLORS[r.status] }}
              />
              {titleCase(r.group)}
            </span>
            <span className="text-muted-foreground">
              {STATUS_LABEL[r.status]} · {formatSince(r.hoursSinceTrained)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
