import { Card } from "@/src/components/card";
import { buttonVariants } from "@/src/components/ui/button";
import { Routine } from "@/src/features/routines/types";
import Image from "next/image";
import Link from "next/link";
import RoutineModal from "../RoutineModal";

export default function RoutineCard({ routine }: { routine: Routine }) {
  const { id, name, routineItems } = routine;
  const maxExercisesShown = 3;
  return (
    <Card className="p-4">
      <header className="flex items-center gap-2 justify-between w-full">
        <h3 className="truncate">{name}</h3>

        <RoutineModal routine={routine} />
      </header>

      <div className="flex gap-2">
        {routineItems.slice(0, maxExercisesShown).map((item) => (
          <div
            key={item.exerciseId}
            className="relative w-17 h-12 overflow-hidden bg-white rounded-md"
          >
            <Image
              src={`https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/refs/heads/main/${item.exercise.imageUrl}`}
              alt={item.exercise.name}
              fill
              className="object-scale-down"
            />
          </div>
        ))}
        {routineItems.length > maxExercisesShown && (
          <div className="flex justify-center items-center">
            <p className="text-2xl">
              {routineItems.length - maxExercisesShown}+
            </p>
          </div>
        )}
      </div>
      <Link
        className={buttonVariants({
          variant: "default",
        })}
        href={`/workouts/active?routine=${id}`}
      >
        Start
      </Link>
    </Card>
  );
}
