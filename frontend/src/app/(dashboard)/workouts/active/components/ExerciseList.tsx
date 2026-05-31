import { Button } from "@/src/components/ui/button";
import { Routine } from "@/src/features/routines/types";
import { Exercise, useWorkout } from "@/src/features/workout/store";
import Image from "next/image";
import React, { useState } from "react";
import { ExercisePickerModal } from "../../../routines/components/ExercisePickerModal";
import { Exercise as BaseExercise } from "@/src/features/exercises/types";
import { Plus } from "lucide-react";
import { getDefaultSets } from "@/src/features/workout/utils";

export default function ExerciseList({ routine }: { routine: Routine | null }) {
  const [isOpen, setIsOpen] = useState(false);

  const { currentExerciseId, setWorkoutData, exercises } = useWorkout();

  const onClick = (currentExerciseId: number) => {
    setWorkoutData({ currentExerciseId });
  };

  function addExercises(newExercises: BaseExercise[]) {
    const exisitingExerciseLookup: Record<number, boolean> = {};

    exercises.forEach((e) => {
      exisitingExerciseLookup[e.id] = true;
    });

    const exercisesToAdd: Exercise[] = newExercises
      .filter((e) => !exisitingExerciseLookup[e.id])
      .map((e) => ({ ...e, sets: getDefaultSets(e) }));

    setWorkoutData({
      exercises: [...exercises, ...exercisesToAdd],
    });

    setIsOpen(false);
  }

  let totalSets = 0;
  let completedSets = 0;

  for (const exercise of exercises) {
    for (const set of exercise.sets) {
      totalSets += 1;
      if (set.isCompleted) {
        completedSets += 1;
      }
    }
  }

  return (
    <div className="flex flex-col">
      <div className="px-2 py-4 bg-secondary overflow-x-scroll">
        <div className="flex gap-2 w-max">
          {!!exercises.length &&
            exercises.map((item) => (
              <ExerciseCard
                key={item.id}
                exercise={item}
                selected={currentExerciseId === item.id}
                onClick={onClick}
              />
            ))}
          <Button className="h-12 w-17" onClick={() => setIsOpen(true)}>
            <Plus />
          </Button>
        </div>
      </div>
      <progress
        className="progress-bar"
        value={completedSets}
        max={totalSets}
      />
      <ExercisePickerModal
        isOpen={isOpen}
        addedExercises={exercises}
        onClose={() => setIsOpen(false)}
        onSelect={addExercises}
      />
    </div>
  );
}

function ExerciseCard({
  exercise,
  selected,
  onClick,
}: {
  exercise: BaseExercise;
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
