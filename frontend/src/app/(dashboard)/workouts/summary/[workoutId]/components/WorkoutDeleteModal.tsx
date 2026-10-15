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
import { deleteWorkout } from "@/src/features/workout/actions";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function WorkoutDeleteModal({
  workoutId,
}: {
  workoutId: number;
}) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const router = useRouter();
  const previousPageRef = useRef<string | null>(null);

  useEffect(() => {
    // Store the previous page URL when component mounts
    previousPageRef.current = document.referrer;
  }, []);

  const handleDelete = async () => {
    const response = await deleteWorkout(workoutId);
    if (response.success) {
      toast.success("Workout deleted successfully");

      // Check if previous page was /workouts/active
      const previousPage = previousPageRef.current;
      if (previousPage?.includes("/workouts/active")) {
        router.push("/workouts");
      } else {
        router.back();
      }
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
