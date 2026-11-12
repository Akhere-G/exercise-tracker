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
  getActiveSupersetGroup,
  getDefaultSets,
  isExerciseCompleted,
  linkWithNext,
  unlinkSuperset,
} from "@/src/features/workout/utils";
import RestTimeDialog from "./RestTimeDialog";
import { useEnsurePreviousSets } from "@/src/features/workout/components/WorkoutContext";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useRouter } from "next/navigation";
import { track } from "@/src/features/analytics/utils";
import ProgressionChip from "@/src/features/progression/components/ProgressionChip";

export default function ExerciseDetails({
  completeWorkout,
  canComplete,
  isCompleting = false,
}: {
  completeWorkout: (onComplete: () => void) => Promise<void>;
  canComplete: boolean;
  isCompleting?: boolean;
}) {
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [restModalOpen, setRestModalOpen] = useState(false);

  const router = useRouter();
  const ensurePreviousSets = useEnsurePreviousSets();

  const { currentExerciseId, exercises, setWorkoutData, resetState } =
    useWorkout();

  const currentExercise = exercises.find((e) => e.id === currentExerciseId);
  const currentIndex = exercises.findIndex((e) => e.id === currentExerciseId);
  const isInSuperset =
    !!currentExercise && getActiveSupersetGroup(exercises, currentExercise) !== null;
  const canLinkWithNext = currentIndex >= 0 && currentIndex < exercises.length - 1;

  async function replaceExercise(newExercises: Exercise[]) {
    const exisiting: Record<number, boolean> = {};
    exercises.forEach((e) => {
      exisiting[e.id] = true;
    });
    const newExercise = newExercises.filter((e) => !exisiting[e.id])[0];
    if (!newExercise) return;

    const replacedId = currentExerciseId;
    const previous = await ensurePreviousSets([newExercise.id]);

    // Read the store again: it may have changed while the sets were loading.
    const updatedExercises = useWorkout
      .getState()
      .exercises.map((e) =>
        e.id === replacedId
          ? {
              ...newExercise,
              sets: getDefaultSets(newExercise, e, {
                previousSets: previous[newExercise.id],
              }),
              supersetGroup: e.supersetGroup,
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

    // Move on to the first unfinished exercise, or the first one if all are done.
    const nextExercise =
      updatedExercises.find((e) => !isExerciseCompleted(e)) ??
      updatedExercises[0];

    setWorkoutData({
      exercises: updatedExercises,
      currentExerciseId: nextExercise?.id ?? 0,
    });
    setRemoveModalOpen(false);
  }

  function cancelWorkout() {
    track("cancel_workout", {
      completed_sets: exercises
        .flatMap((e) => e.sets)
        .filter((s) => s.isCompleted).length,
    });
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
              <ProgressionChip exercise={currentExercise} />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Exercise options">
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
                <DropdownMenuItem onClick={() => setRestModalOpen(true)}>
                  Rest time…
                </DropdownMenuItem>
                {canLinkWithNext && (
                  <DropdownMenuItem
                    onClick={() =>
                      setWorkoutData({
                        exercises: linkWithNext(exercises, currentExerciseId),
                      })
                    }
                  >
                    Superset with next exercise
                  </DropdownMenuItem>
                )}
                {isInSuperset && (
                  <DropdownMenuItem
                    onClick={() =>
                      setWorkoutData({
                        exercises: unlinkSuperset(exercises, currentExerciseId),
                      })
                    }
                  >
                    Remove from superset
                  </DropdownMenuItem>
                )}
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
              <Button
                variant="default"
                disabled={isCompleting}
                onClick={() => completeWorkout(() => setFinishModalOpen(false))}
              >
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
          <RestTimeDialog
            key={currentExercise.id}
            exerciseId={currentExercise.id}
            exerciseName={currentExercise.name}
            open={restModalOpen}
            onOpenChange={setRestModalOpen}
          />
        )}

        {currentExercise && (
          <ExercisePickerModal
            addedExercises={[currentExercise]}
            isOpen={isExerciseModalOpen}
            onClose={() => setIsExerciseModalOpen(false)}
            onSelect={replaceExercise}
            selectMany={false}
            title="Replace Exercise"
            submitBtnText="Replace"
            defaultMuscle={currentExercise.muscles[0]?.name}
          />
        )}
      </div>
    </div>
  );
}
