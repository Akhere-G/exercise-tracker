"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { saveExerciseRestTime } from "@/src/features/profile/actions";
import { useRestSettings } from "@/src/features/workout/components/WorkoutContext";
import { useWorkout } from "@/src/features/workout/store";
import { DEFAULT_REST_SECS } from "@/src/features/workout/utils";

const MAX_REST_SECS = 60 * 60;

export default function RestTimeDialog({
  exerciseId,
  exerciseName,
  open,
  onOpenChange,
}: {
  exerciseId: number;
  exerciseName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { exercises, setWorkoutData } = useWorkout();
  const { restSettings, setRestSetting } = useRestSettings();
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const current =
    exercises.find((e) => e.id === exerciseId)?.restSecs ??
    restSettings[exerciseId] ??
    DEFAULT_REST_SECS;

  async function save(restSecs: number | null) {
    setIsSaving(true);
    const response = await saveExerciseRestTime(exerciseId, restSecs);
    setIsSaving(false);

    if (!response.success) {
      toast.error(response.error ?? "Could not save the rest time.");
      return;
    }

    setRestSetting(exerciseId, restSecs);
    setWorkoutData({
      exercises: exercises.map((e) =>
        e.id === exerciseId ? { ...e, restSecs } : e,
      ),
    });
    setDraft("");
    onOpenChange(false);
  }

  const parsed = Number(draft);
  const isValid =
    draft.trim() !== "" &&
    Number.isInteger(parsed) &&
    parsed >= 0 &&
    parsed <= MAX_REST_SECS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogTitle>Rest time for {exerciseName}</DialogTitle>
        <DialogDescription>
          The timer starts with this duration after each set. Currently {current}{" "}
          seconds.
        </DialogDescription>
        <label className="flex flex-col gap-1 text-sm">
          Seconds
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_REST_SECS}
            placeholder={String(current)}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        </label>
        <DialogFooter>
          <DialogClose>Cancel</DialogClose>
          <Button
            variant="secondary"
            disabled={isSaving}
            onClick={() => save(null)}
          >
            Use default
          </Button>
          <Button disabled={!isValid || isSaving} onClick={() => save(parsed)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
