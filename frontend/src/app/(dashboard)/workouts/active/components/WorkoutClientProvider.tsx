"use client";
import { useEffect } from "react";

import ExerciseDetails from "./ExerciseDetails";
import SetList from "../../../routines/components/SetList";
import RestTimeTracker from "./RestTimeTracker";
import { Routine } from "@/src/features/routines/types";
import {
  Exercise,
  useWorkout,
  WorkoutState,
  workoutStorageKey,
} from "@/src/features/workout/store";
import ExerciseList from "./ExerciseList";
import {
  getDefaultSets,
  isWorkoutCompleted,
} from "@/src/features/workout/utils";
import { toast } from "sonner";
import { Toaster } from "@/src/components/ui/sonner";
import { Button } from "@/src/components/ui/button";
import { WorkoutSchema } from "@/src/features/workout/schema";
import { createWorkout } from "@/src/features/workout/actions";

import { useRouter } from "next/navigation";

export default function WorkoutClientProvider({
  routine,
}: {
  routine: Routine | null;
}) {
  const { setWorkoutData, exercises, startedAt } = useWorkout();
  const router = useRouter();

  useEffect(() => {
    try {
      const workoutJson = localStorage.getItem(workoutStorageKey);

      if (workoutJson) {
        const workoutData: { state: WorkoutState } = JSON.parse(workoutJson);

        setWorkoutData(workoutData.state);
        return;
      }
    } catch {}

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
        routineName: routine.name,
        currentExerciseId: routine.routineItems[0].exerciseId,
        exercises,
        startedAt: new Date(),
      });
    }
  }, [routine, setWorkoutData]);

  async function completeWorkout() {
    const completedAt = new Date();
    const workout: WorkoutSchema = {
      completedAt,
      duration: completedAt.getMilliseconds() - startedAt!.getMilliseconds(),
      routineId: routine?.id,
      sets: exercises.flatMap((e) => e.sets).filter((s) => s.isCompleted),
    };
    try {
      const response = await createWorkout(workout);
      if (response.success) {
        const newWorkout = response.data;
        router.push(`/workouts/summary/${newWorkout.id}?first=true`);
      } else {
        toast.error(response.error);
      }
    } catch {
      toast.error("Could not save workout.");
    }
  }
  return (
    <div className="relative  h-screen flex flex-1 flex-col justify-between">
      <div>
        <Toaster position="top-right" richColors closeButton />

        <ExerciseList />
        <ExerciseDetails
          completeWorkout={completeWorkout}
          canComplete={exercises
            .flatMap((e) => e.sets)
            .some((s) => s.isCompleted)}
        />
        <SetList routine={routine} />
      </div>
      <RestTimeTracker />

      <div
        className={`fixed left-0 w-full px-4 transition-all duration-300 ${isWorkoutCompleted(exercises) ? "bottom-8 opacity-100" : "-bottom-full opacity-0"}`}
      >
        <Button onClick={completeWorkout} className="w-full shadow-2xl">
          Complete Workout
        </Button>
      </div>
    </div>
  );
}
