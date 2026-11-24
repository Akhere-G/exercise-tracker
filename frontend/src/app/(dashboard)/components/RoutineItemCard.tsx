import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/card";
import { getImageUrl } from "@/src/features/exercises/utils";
import { TargetText } from "@/src/features/routines/components/TargetText";
import { RoutineItem } from "@/src/features/routines/types";
import { Dot } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function RoutineItemCard({
  routineItem,
}: {
  routineItem: RoutineItem;
}) {
  const { exercise } = routineItem;

  const { equipment, muscles } = exercise;

  return (
    <Link href={`/exercises/${exercise.id}`}>
      <Card className="pt-0">
        <div className="relative w-full h-24 bg-white">
          <Image
            src={getImageUrl(exercise.imageUrl)}
            alt={exercise.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
              <p className="font-bold brightness-110">
                <TargetText target={routineItem} />
              </p>
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
