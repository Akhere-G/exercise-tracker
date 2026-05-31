"use client";
import { useEffect } from "react";

import ExerciseDetails from "./ExerciseDetails";
import SetList from "../../../routines/components/SetList";
import RestTimeTracker from "./RestTimeTracker";
import { Routine } from "@/src/features/routines/types";
import { Exercise, useWorkout } from "@/src/features/workout/store";
import ExerciseList from "./ExerciseList";
import { getDefaultSets } from "@/src/features/workout/utils";
import { useTimer } from "@/src/features/timer/store";
import { toast } from "sonner";
import { Toaster } from "@/src/components/ui/sonner";

export default function WorkoutClientProvider({
  routine,
}: {
  routine: Routine | null;
}) {
  const { setWorkoutData } = useWorkout();
  const { currentTime, isRunning } = useTimer();

  useEffect(() => {
    if (routine) {
      const exercises: Exercise[] = [];

      for (const item of routine.routineItems) {
        const { exercise } = item;
        // TODO: set routineItem data to get new set using targetRep and time data
        const exerciseItem: Exercise = {
          ...exercise,
          sets: getDefaultSets(exercise),
        };

        exercises.push(exerciseItem);
      }

      setWorkoutData({
        routineId: routine.id,
        currentExerciseId: routine.routineItems[0].exerciseId,
        exercises,
      });
    }
  }, [routine, setWorkoutData]);

  useEffect(() => {
    console.log(currentTime);
    if (currentTime === 0 && isRunning) {
      toast("Rest complete!");
      // TODO: Add sound
    }
  }, [currentTime, isRunning]);

  return (
    <div className="relative  h-screen flex flex-1 flex-col justify-between">
      <div>
        <Toaster position="top-right" richColors closeButton />

        <ExerciseList />
        <ExerciseDetails />
        <SetList routine={routine} />
      </div>
      <RestTimeTracker />
    </div>
  );
}
