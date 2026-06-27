"use client";
import { Card } from "@/src/components/card";
import { Button } from "@/src/components/ui/button";
import { Routine } from "@/src/features/routines/types";
import Image from "next/image";
import RoutineModal from "../RoutineModal";
import { useWorkout } from "@/src/features/workout/store";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { getImageUrl } from "@/src/features/exercises/utils";
import StartWorkoutDialog from "./StartWorkoutDialog";

export default function RoutineCard({ routine }: { routine: Routine }) {
  const [isOpen, setIsOpen] = useState(false);
  const { id, name, routineItems } = routine;
  const { startedAt } = useWorkout();
  const maxExercisesShown = 3;
  const router = useRouter();
  function startWorkout() {
    if (!startedAt) {
      router.push(`/workouts/active?routineId=${id}`);
    } else {
      setIsOpen(true);
    }
  }

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
              src={getImageUrl(item.exercise.imageUrl)}
              alt={item.exercise.name}
              fill
              className="object-scale-down"
              sizes="68px"
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
      <Button variant="default" onClick={startWorkout}>
        Start
      </Button>
      <StartWorkoutDialog
        isOpen={isOpen}
        routineId={id}
        setIsOpen={setIsOpen}
      />
    </Card>
  );
}
