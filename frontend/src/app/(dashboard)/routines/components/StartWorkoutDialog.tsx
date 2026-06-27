"use client";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useWorkout, workoutStorageKey } from "@/src/features/workout/store";
import { useRouter } from "next/navigation";

export default function StartWorkoutDialog({
  isOpen,
  setIsOpen,
  routineId,
}: {
  routineId?: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const router = useRouter();
  const { resetState } = useWorkout();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DialogContent>
        <DialogTitle>You have a workout in progress</DialogTitle>
        <DialogDescription>
          If you start a new workout, your current one will be permanently
          deleted.
        </DialogDescription>
        <DialogFooter className="flex-wrap ">
          <Button
            className="flex-1"
            onClick={() => {
              router.push(`/workouts/active?routineId=${routineId}`);
            }}
          >
            Resume current workout
          </Button>
          <Button
            className="flex-1"
            variant="destructive"
            onClick={() => {
              localStorage.removeItem(workoutStorageKey);
              resetState();
              router.push(`/workouts/active?routineId=${routineId}`);
            }}
          >
            Start new workout
          </Button>
          <DialogClose className="flex-1">Cancel</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
