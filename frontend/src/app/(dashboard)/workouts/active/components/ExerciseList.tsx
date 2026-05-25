import { Button } from "@/src/components/ui/button";
import { Exercise } from "@/src/features/exercises/types";
import { Routine } from "@/src/features/routines/types";
import { useWorkout } from "@/src/features/workout/store";
import Image from "next/image";
import React from "react";

export default function ExerciseList({ routine }: { routine: Routine | null }) {
  const { currentExerciseId, setWorkoutData, exercises } = useWorkout();

  const onClick = (currentExerciseId: number) => {
    setWorkoutData({ currentExerciseId });
  };
  return (
    <div>
      <div className="px-2 py-4 bg-secondary overflow-x-scroll">
        <div className="flex gap-2 w-max">
          {!!routine &&
            exercises.map((item) => (
              <ExerciseCard
                key={item.id}
                exercise={item}
                selected={currentExerciseId === item.id}
                onClick={onClick}
              />
            ))}
          <Button className="h-12 w-17">+</Button>
        </div>
      </div>
    </div>
  );
}

function ExerciseCard({
  exercise,
  selected,
  onClick,
}: {
  exercise: Exercise;
  selected: boolean;
  onClick: (exerciseId: number) => void;
}) {
  return (
    <div
      className={`relative w-17 h-12 overflow-hidden bg-white rounded-md transition-opacity duration-300 ${selected ? "" : "opacity-50"}`}
      onClick={() => onClick(exercise.id)}
    >
      <Image
        src={`https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/refs/heads/main/${exercise.imageUrl}`}
        alt={exercise.name}
        fill
        className="object-scale-down"
      />
    </div>
  );
}
