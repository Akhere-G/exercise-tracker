import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/card";
import { formatWeight, WeightUnit } from "@/src/lib/units";
import { Goals } from "../types";
import GoalRow from "./GoalRow";

export default function GoalsCard({
  goals,
  unit,
}: {
  goals: Goals;
  unit: WeightUnit;
}) {
  const { weekly, bodyWeight, lift } = goals;
  if (!weekly && !bodyWeight && !lift) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your goals</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {weekly && (
          <GoalRow
            label="Workouts this week"
            detail={`${weekly.completed} / ${weekly.target}`}
            progress={weekly.completed / weekly.target}
          />
        )}
        {bodyWeight && (
          <GoalRow
            label="Body weight"
            detail={
              bodyWeight.currentKg === null
                ? `Goal ${formatWeight(bodyWeight.targetKg, unit)}`
                : `${formatWeight(bodyWeight.currentKg, unit)} → ${formatWeight(bodyWeight.targetKg, unit)}`
            }
          />
        )}
        {lift && (
          <GoalRow
            label={lift.exerciseName}
            detail={`${lift.bestKg === null ? "–" : formatWeight(lift.bestKg, unit)} / ${formatWeight(lift.targetKg, unit)}`}
            progress={(lift.bestKg ?? 0) / lift.targetKg}
          />
        )}
      </CardContent>
    </Card>
  );
}
