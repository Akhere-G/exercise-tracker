"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import {
  createRoutineFromWorkout,
  syncRoutineFromWorkout,
} from "../actions";
import { getDayStr, RoutineDiff, toUtcSchedule } from "../utils";
import { track } from "@/src/features/analytics/utils";

export interface ReuseTarget {
  workoutId: number;
  routine: { id: number; name: string } | null;
  diff: RoutineDiff | null;
  suggestedName: string;
}

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function PostWorkoutReuseDialog({
  target,
  onDone,
}: {
  target: ReuseTarget;
  onDone: () => void;
}) {
  const { workoutId, routine, diff, suggestedName } = target;
  const [mode, setMode] = useState<"choose" | "new">(
    routine ? "choose" : "new",
  );
  const [name, setName] = useState(suggestedName);
  const [day, setDay] = useState((new Date().getDay() + 6) % 7);
  const [time, setTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const run = async (
    event: "routine_from_workout" | "routine_synced",
    action: () => Promise<{ success: boolean; error?: string }>,
    message: string,
  ) => {
    setIsSaving(true);
    const response = await action();
    if (response.success) {
      track(event);
      toast.success(message);
      onDone();
    } else {
      toast.error(response.error ?? "Could not update the routine.");
      setIsSaving(false);
    }
  };

  const saveAsNew = () => {
    if (!name.trim()) return toast.error("Give the routine a name.");
    const schedule = time ? toUtcSchedule(day, time) : null;
    return run(
      "routine_from_workout",
      () =>
        createRoutineFromWorkout(workoutId, {
          name: name.trim(),
          day: schedule?.day ?? day,
          startTime: schedule?.startTime,
        }),
      "Routine saved",
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !isSaving && onDone()}>
      <DialogContent>
        {mode === "choose" && routine && diff ? (
          <>
            <DialogTitle>You changed {routine.name}</DialogTitle>
            <DialogDescription>
              This workout differs from the routine. Update it to match?
            </DialogDescription>
            <ul className="text-sm space-y-1">
              {diff.added.map((e) => (
                <li key={`a${e.exerciseId}`}>+ {e.name} ({e.sets} sets)</li>
              ))}
              {diff.removed.map((e) => (
                <li key={`r${e.exerciseId}`} className="text-muted-foreground">
                  − {e.name}
                </li>
              ))}
              {diff.changed.map((e) => (
                <li key={`c${e.exerciseId}`}>
                  {e.name}: {e.from} → {e.to} sets
                </li>
              ))}
            </ul>
            <DialogFooter className="flex-wrap">
              <Button
                className="flex-1"
                disabled={isSaving}
                onClick={() =>
                  run(
                    "routine_synced",
                    () => syncRoutineFromWorkout(routine.id, workoutId),
                    "Routine updated",
                  )
                }
              >
                Update routine
              </Button>
              <Button
                className="flex-1"
                variant="secondary"
                disabled={isSaving}
                onClick={() => setMode("new")}
              >
                Save as new routine
              </Button>
              <Button
                className="flex-1"
                variant="ghost"
                disabled={isSaving}
                onClick={onDone}
              >
                Keep as is
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogTitle>Save as a routine?</DialogTitle>
            <DialogDescription>
              Turn what you just did into a routine you can repeat.
            </DialogDescription>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              aria-label="Routine name"
            />
            <div className="flex flex-wrap gap-1">
              {DAYS.map((d) => (
                <Button
                  key={d}
                  type="button"
                  size="sm"
                  variant={d === day ? "default" : "secondary"}
                  onClick={() => setDay(d)}
                >
                  {getDayStr(d)?.slice(0, 3)}
                </Button>
              ))}
            </div>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              aria-label="Start time (optional)"
            />
            <DialogFooter className="flex-wrap">
              <Button className="flex-1" disabled={isSaving} onClick={saveAsNew}>
                Save routine
              </Button>
              <Button
                className="flex-1"
                variant="ghost"
                disabled={isSaving}
                onClick={onDone}
              >
                Skip
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
