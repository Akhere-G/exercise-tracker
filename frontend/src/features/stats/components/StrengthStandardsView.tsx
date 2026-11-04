import Link from "next/link";
import { WeightText } from "@/src/features/profile/components/Weight";
import { StrengthStandards } from "../types";
import { titleCase } from "../utils";

const LEVELS = ["beginner", "novice", "intermediate", "advanced", "elite"];

export default function StrengthStandardsView({
  standards,
}: {
  standards: StrengthStandards;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="text-xl">Strength levels</h3>
        <p className="text-sm text-muted-foreground">
          Your best estimated one-rep max from the last 180 days, compared with
          your body weight. These are rough guidelines.
        </p>
      </div>

      {standards.bodyWeightKg === null && (
        <p className="rounded-lg bg-muted p-3 text-sm">
          Log your body weight on the{" "}
          <Link href="/body" className="underline">
            body weight page
          </Link>{" "}
          to see your levels.
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {standards.lifts.map((lift) => {
          const reached = lift.level ? LEVELS.indexOf(lift.level) : -1;
          return (
            <li key={lift.key} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium">{lift.name}</span>
                <span className="text-sm text-muted-foreground">
                  {lift.estimatedOneRepMax === null ? (
                    "No data yet"
                  ) : (
                    <>
                      <WeightText kg={lift.estimatedOneRepMax} /> e1RM
                      {lift.ratio !== null && ` · ${lift.ratio}× body weight`}
                    </>
                  )}
                </span>
              </div>
              {lift.level && (
                <>
                  <div className="mt-3 flex gap-1" aria-hidden>
                    {LEVELS.map((level, i) => (
                      <div key={level} className="flex-1">
                        <div
                          className={`h-2 rounded-full ${i <= reached ? "bg-primary" : "bg-muted"}`}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-sm">
                    <strong>{titleCase(lift.level)}</strong>
                    {lift.nextLevel && lift.kgToNext !== null && (
                      <span className="text-muted-foreground">
                        {" "}
                        · <WeightText kg={Math.max(lift.kgToNext, 0)} /> to{" "}
                        {lift.nextLevel}
                      </span>
                    )}
                  </p>
                </>
              )}
              {!lift.level && lift.estimatedOneRepMax !== null && standards.bodyWeightKg !== null && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Not yet at beginner level.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
