import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { useWorkout } from "@/src/features/workout/store";
import { MoreVertical } from "lucide-react";
import { ExercisePickerModal } from "../../../routines/components/ExercisePickerModal";
import { useState } from "react";
import { Exercise } from "@/src/features/exercises/types";
import {
  getDefaultSets,
  isExerciseCompleted,
} from "@/src/features/workout/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";

export default function ExerciseDetails() {
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const { currentExerciseId, exercises, setWorkoutData } = useWorkout();

  const currentExercise = exercises.find((e) => e.id === currentExerciseId);

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
            sets: getDefaultSets(newExercise, e),
          }
        : e,
    );
    //TODO: preserve set data if user is replacing and exercise with one of the same type
    //TODO: replace modal should show related exercises

    setWorkoutData({
      exercises: updatedExercises,
      currentExerciseId: newExercise.id,
    });
    setIsExerciseModalOpen(false);
  }

  function removeLastSet() {
    const updatedExercises = exercises.map((e) =>
      e.id === currentExerciseId ? { ...e, sets: e.sets.slice(0, -1) } : e,
    );

    setWorkoutData({ exercises: updatedExercises });
  }

  function removeExercise() {
    const updatedExercises = exercises.filter(
      (e) => e.id !== currentExerciseId,
    );

    let nextExercise: Exercise | null | undefined = updatedExercises.find(
      (e) => !isExerciseCompleted(e),
    );

    nextExercise =
      (nextExercise ?? updatedExercises.length > 0)
        ? updatedExercises[0]
        : null;
    setWorkoutData({
      exercises: updatedExercises,
      currentExerciseId: nextExercise?.id,
    });
    setRemoveModalOpen(false);
  }

  if (!currentExercise)
    return (
      <div className="p-8 text-center">
        <h2>No Exercise selected</h2>
      </div>
    );

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
            <DropdownMenuItem onClick={() => setIsExerciseModalOpen(true)}>
              Replace
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRemoveModalOpen(true)}>
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Dialog
          open={removeModalOpen}
          onOpenChange={(open) => setRemoveModalOpen(open)}
        >
          <DialogContent onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>Delete {currentExercise.name}?</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Delete {currentExercise.name} and all its sets?
            </DialogDescription>
            <DialogFooter>
              <DialogClose>
                <Button variant="secondary" className="w-full">
                  Close
                </Button>
              </DialogClose>
              <Button variant="destructive" onClick={removeExercise}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <ExercisePickerModal
          addedExercises={[currentExercise]}
          isOpen={isExerciseModalOpen}
          onClose={() => setIsExerciseModalOpen(false)}
          onSelect={replaceExercise}
          selectMany={false}
          title="Replace Exercise"
          submitBtnText="Replace"
        />
      </div>
    </div>
  );
}
