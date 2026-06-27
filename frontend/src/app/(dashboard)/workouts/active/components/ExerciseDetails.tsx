"use client";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { useWorkout, workoutStorageKey } from "@/src/features/workout/store";
import { Dot, MoreVertical } from "lucide-react";
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
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useRouter } from "next/navigation";

export default function ExerciseDetails({
  completeWorkout,
  canComplete,
}: {
  completeWorkout: () => Promise<void>;
  canComplete: boolean;
}) {
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const router = useRouter();

  const { currentExerciseId, exercises, setWorkoutData, resetState } =
    useWorkout();

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

  function cancelWorkout() {
    resetState();
    localStorage.removeItem(workoutStorageKey);
    router.push("/routines");
  }

  return (
    <div className="mt-4 px-2">
      <div className="flex gap-2 justify-between items-start">
        {!currentExercise ? (
          <div className="p-8 text-center flex flex-col items-center w-full ">
            <h2 className="mb-4">No exercises</h2>

            <Button
              variant="destructive"
              onClick={() => {
                console.log("clicked");
                setCancelModalOpen(true);
              }}
            >
              Cancel Workout
            </Button>
          </div>
        ) : (
          <>
            <div>
              <h2>{currentExercise.name}</h2>
              <div className="flex items-center">
                <p className="capitalize text-sm text-secondary-foreground">
                  {currentExercise.equipment}
                </p>
                <Dot width={16} />
                <p className="capitalize text-sm text-secondary-foreground">
                  {currentExercise.muscles.map((m) => m.name).join(", ")}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <MoreVertical size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => router.push(`/exercises/${currentExerciseId}`)}
                >
                  Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={removeLastSet}>
                  Remove Last set
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsExerciseModalOpen(true)}>
                  Replace Exercise
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setRemoveModalOpen(true)}
                >
                  Remove Exercise
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setCancelModalOpen(true)}
                >
                  Cancel Workout
                </DropdownMenuItem>
                {canComplete && (
                  <DropdownMenuItem onClick={() => setFinishModalOpen(true)}>
                    Finish Workout
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        {currentExercise && (
          <Dialog
            open={removeModalOpen}
            onOpenChange={(open) => setRemoveModalOpen(open)}
          >
            <DialogContent onClick={(e) => e.stopPropagation()}>
              <DialogTitle>Delete {currentExercise.name}?</DialogTitle>
              <DialogDescription>
                Delete {currentExercise.name} and all its sets?
              </DialogDescription>
              <DialogFooter>
                <DialogClose>Close</DialogClose>
                <Button variant="destructive" onClick={removeExercise}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Dialog
          open={finishModalOpen}
          onOpenChange={(open) => setFinishModalOpen(open)}
        >
          <DialogContent onClick={(e) => e.stopPropagation()}>
            <DialogTitle>Finish workout?</DialogTitle>
            <DialogDescription>
              Only completed sets will be saved.
            </DialogDescription>
            <DialogFooter>
              <DialogClose>Cancel</DialogClose>
              <Button variant="default" onClick={() => completeWorkout()}>
                Finish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={cancelModalOpen}
          onOpenChange={(open) => setCancelModalOpen(open)}
        >
          <DialogContent onClick={(e) => e.stopPropagation()}>
            <DialogTitle>Cancel workout?</DialogTitle>
            <DialogDescription>All sets will be deleted.</DialogDescription>
            <DialogFooter>
              <DialogClose>Continue workout</DialogClose>
              <Button variant="destructive" onClick={cancelWorkout}>
                Cancel Workout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {currentExercise && (
          <ExercisePickerModal
            addedExercises={[currentExercise]}
            isOpen={isExerciseModalOpen}
            onClose={() => setIsExerciseModalOpen(false)}
            onSelect={replaceExercise}
            selectMany={false}
            title="Replace Exercise"
            submitBtnText="Replace"
            defaultMuscle={currentExercise.muscles[0].name}
          />
        )}
      </div>
    </div>
  );
}
