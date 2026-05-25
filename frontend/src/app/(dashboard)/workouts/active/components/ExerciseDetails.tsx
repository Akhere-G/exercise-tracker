import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Routine } from "@/src/features/routines/types";
import { useWorkout } from "@/src/features/workout/store";
import { MoreVertical } from "lucide-react";
import { ExercisePickerModal } from "../../../routines/components/ExercisePickerModal";
import { useState } from "react";
import { Exercise } from "@/src/features/exercises/types";
import { getDefaultSets } from "@/src/features/workout/utils";

export default function ExerciseDetails({
  routine,
}: {
  routine: Routine | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { currentExerciseId, exercises, setWorkoutData } = useWorkout();

  const currentExercise = exercises.find((e) => e.id === currentExerciseId);

  if (!currentExercise) return;

  function replaceExercise(newExercises: Exercise[]) {
    const exisiting: Record<number, boolean> = {};
    exercises.forEach((e) => {
      exisiting[e.id] = true;
    });
    const newExercise = newExercises.filter((e) => !exisiting[e.id])[0];
    if (!newExercise) return;

    const updatedExercises = exercises.map((e) =>
      e.id === currentExerciseId
        ? {
            ...newExercise,
            sets: getDefaultSets(newExercise),
          }
        : e,
    );
    //TODO: preserve set data if user is replacing and exercise with one of the same type
    //TODO: replace modal should show related exercises

    setWorkoutData({
      exercises: updatedExercises,
      currentExerciseId: newExercise.id,
    });
    setIsOpen(false);
  }

  function removeLastSet() {
    const updatedExercises = exercises.map((e) =>
      e.id === currentExerciseId ? { ...e, sets: e.sets.slice(0, -1) } : e,
    );

    setWorkoutData({ exercises: updatedExercises });
  }
  return (
    <div className="mt-4 px-2">
      <div className="flex gap-2 justify-between items-start">
        <div className="">
          <h2>{currentExercise.name}</h2>
          <p className="capitalize text-sm text-secondary-foreground">
            {currentExercise.equipment}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <MoreVertical size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={removeLastSet}>
              Remove Last set
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsOpen(true)}>
              Replace
            </DropdownMenuItem>
            <DropdownMenuItem>Remove</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ExercisePickerModal
          addedExercises={[currentExercise]}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSelect={replaceExercise}
          selectMany={false}
          title="Replace Exercise"
          submitBtnText="Replace"
        />
      </div>
    </div>
  );
}
