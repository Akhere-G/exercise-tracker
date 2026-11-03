"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Repeat } from "lucide-react";
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
import { useWorkout, workoutStorageKey } from "../store";
import { Workout } from "../types";
import { getExercisesFromWorkout } from "../utils";

const hasWorkoutInProgress = () => {
  try {
    const json = localStorage.getItem(workoutStorageKey);
    return Boolean(json && JSON.parse(json).state?.exercises?.length);
  } catch {
    return false;
  }
};

export default function RepeatWorkoutButton({ workout }: { workout: Workout }) {
  const router = useRouter();
  const { setWorkoutData, resetState } = useWorkout();
  const [isConfirming, setIsConfirming] = useState(false);

  const target = workout.routineId
    ? `/workouts/active?routineId=${workout.routineId}`
    : "/workouts/active";

  const start = () => {
    const exercises = getExercisesFromWorkout(workout);
    if (exercises.length === 0) return;

    resetState();
    setWorkoutData({
      routineId: workout.routineId ?? null,
      routineName: null,
      currentExerciseId: exercises[0].id,
      exercises,
      startedAt: new Date(),
    });
    track("repeat_workout");
    router.push(target);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => (hasWorkoutInProgress() ? setIsConfirming(true) : start())}
      >
        <Repeat size={14} />
        Repeat
      </Button>
      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent>
          <DialogTitle>You have a workout in progress</DialogTitle>
          <DialogDescription>
            Repeating this workout will permanently delete your current one.
          </DialogDescription>
          <DialogFooter className="flex-wrap">
            <Button className="flex-1" onClick={() => router.push(target)}>
              Resume current workout
            </Button>
            <Button className="flex-1" variant="destructive" onClick={start}>
              Start repeat
            </Button>
            <DialogClose className="flex-1">Cancel</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
