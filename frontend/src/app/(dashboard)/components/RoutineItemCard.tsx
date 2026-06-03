import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/card";
import { ExerciseImage } from "../workouts/components/ExerciseImage";
import { RoutineItem } from "@/src/features/routines/types";

export default function RoutineItemCard({
  routineItem,
}: {
  routineItem: RoutineItem;
}) {
  const { exercise, targetSets, targetReps, targetDurationSecs } = routineItem;

  const duration = targetDurationSecs
    ? Math.ceil(targetDurationSecs / 60)
    : null;

  console.log(routineItem);
  return (
    <Card>
      <CardHeader className="flex gap-2">
        <ExerciseImage exercise={exercise} />
        <div className="">
          <CardTitle>{exercise.name}</CardTitle>
          <CardDescription>
            <p className="flex gap-2  items-center">
              {targetSets} set{targetSets === 1 ? "" : "s"}
              {targetReps && (
                <span>
                  {targetReps} rep{targetReps === 1 ? "" : "s"}
                </span>
              )}
              {duration && (
                <span>
                  {duration} min{duration === 1 ? "" : "s"}
                </span>
              )}
            </p>
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}
