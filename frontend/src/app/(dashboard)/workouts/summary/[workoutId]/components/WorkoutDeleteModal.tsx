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
import { track } from "@/src/features/analytics/utils";
import { deleteWorkout } from "@/src/features/workout/actions";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function WorkoutDeleteModal({
  workoutId,
}: {
  workoutId: number;
}) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const router = useRouter();
  const handleDelete = async () => {
    const response = await deleteWorkout(workoutId);
    if (response.success) {
      track("delete_workout");
      toast.success("Workout deleted successfully");
      // The summary no longer exists. Going "back" could restart the finished
      // workout or leave the app, so always land on the history.
      router.replace("/workouts");
    } else {
      toast.error(response.error || "Failed to delete workout");
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        className="gap-2"
        onClick={() => setDeleteModalOpen(true)}
      >
        <Trash2 size={14} />
        Delete
      </Button>

      <Dialog
        open={deleteModalOpen}
        onOpenChange={(open) => setDeleteModalOpen(open)}
      >
        <DialogContent>
          <DialogTitle>Delete Workout?</DialogTitle>
          <DialogDescription>
            Do you want to delete this workout permanently?
          </DialogDescription>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
