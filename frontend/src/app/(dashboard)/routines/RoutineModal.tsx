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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { deleteRoutine } from "@/src/features/routines/actions";
import { Routine } from "@/src/features/routines/types";
import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RoutineModal({ routine }: { routine: Routine }) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const router = useRouter();
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <button className="p-2">
            <MoreVertical size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => router.push(`/routines/${routine.id}`)}
          >
            Details
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/routines/edit/${routine.id}`)}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={deleteModalOpen}
        onOpenChange={(open) => setDeleteModalOpen(open)}
      >
        <DialogContent>
          <DialogTitle>Delete {routine.name}?</DialogTitle>
          <DialogDescription>
            Do you want to delete this routine permanently?
          </DialogDescription>
          <DialogFooter>
            <DialogClose>Close</DialogClose>
            <Button
              variant="destructive"
              onClick={async () => {
                await deleteRoutine(routine.id);
                router.refresh();
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
