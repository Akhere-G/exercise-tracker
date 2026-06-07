import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/card";
import { RoutineItem } from "@/src/features/routines/types";
import { Dot } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function RoutineItemCard({
  routineItem,
}: {
  routineItem: RoutineItem;
}) {
  const { exercise, targetSets, targetReps, targetDurationSecs } = routineItem;

  const { equipment, muscles } = exercise;
  const duration = targetDurationSecs
    ? Math.ceil(targetDurationSecs / 60)
    : null;

  return (
    <Link href={`/exercises/${exercise.id}`}>
      <Card className="pt-0">
        <div className="relative w-full h-24 bg-white">
          <Image
            src={`https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/refs/heads/main/${exercise.imageUrl}`}
            alt={exercise.name}
            fill
            className="object-scale-down"
          />
        </div>
        <CardHeader className="flex gap-2 flex-wrap">
          <div className="">
            <CardTitle>{exercise.name}</CardTitle>
            <CardDescription className="flex items-center flex-wrap text-muted-foreground capitalize gap-0.5 mb-2">
              <span>{equipment}</span>
              <Dot className="w-3 h-3 opacity-60 shrink-0" />
              <span className="truncate">
                {muscles.map((m) => m.name).join(", ")}
              </span>
            </CardDescription>
            <CardDescription>
              <p className="flex gap-2 items-center font-bold brightness-110">
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
    </Link>
  );
}
