"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { track } from "@/src/features/analytics/utils";
import { getDayStr } from "@/src/features/routines/utils";
import { applyProgram } from "../actions";
import { Program } from "../types";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function ApplyProgramDialog({
  program,
  open,
  onOpenChange,
}: {
  program: Program;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [startDay, setStartDay] = useState("0");
  const [isApplying, setIsApplying] = useState(false);

  const apply = async () => {
    setIsApplying(true);
    const response = await applyProgram(program.slug, Number(startDay));
    setIsApplying(false);

    if (!response.success) {
      toast.error(response.error);
      return;
    }
    track("apply_program", { slug: program.slug });
    toast.success(`Added ${response.data.length} routines`);
    onOpenChange(false);
    router.push("/routines");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Add {program.name}</DialogTitle>
        <DialogDescription>
          This creates {program.days.length} routines. Choose the day the first
          one falls on.
        </DialogDescription>
        <Select value={startDay} onValueChange={setStartDay}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAYS.map((day) => (
              <SelectItem key={day} value={String(day)}>
                {getDayStr(day)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <DialogClose>Cancel</DialogClose>
          <Button onClick={apply} disabled={isApplying}>
            Add to my routines
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
