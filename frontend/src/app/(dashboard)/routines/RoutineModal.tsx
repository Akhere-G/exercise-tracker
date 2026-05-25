"use client";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { deleteRoutine } from "@/src/features/routines/api";
import { Routine } from "@/src/features/routines/types";
import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";

// TODO: Make sure page refreshes on delete

export default function RoutineModal({ routine }: { routine: Routine }) {
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
            onClick={() => router.push(`/routines/edit/${routine.id}`)}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Dialog>
              <DialogTrigger onClick={(e) => e.stopPropagation()}>
                Delete
              </DialogTrigger>
              <DialogContent onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                  <DialogTitle>Delete {routine.name}?</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  Do you want to delete this routine permanently?
                </DialogDescription>
                <DialogFooter>
                  <DialogClose>
                    <Button variant="secondary">Close</Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={() => deleteRoutine(routine.id)}
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
