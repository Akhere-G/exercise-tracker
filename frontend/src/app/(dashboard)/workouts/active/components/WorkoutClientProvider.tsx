"use client";
import { useEffect } from "react";

import ExerciseDetails from "./ExerciseDetails";
import SetList from "../../../routines/components/SetList";
import RestTimeTracker from "./RestTimeTracker";
import { Routine } from "@/src/features/routines/types";
import { Exercise, useWorkout } from "@/src/features/workout/store";
import ExerciseList from "./ExerciseList";
import { getDefaultSets } from "@/src/features/workout/utils";

export default function WorkoutClientProvider({
  routine,
}: {
  routine: Routine | null;
}) {
  const { setWorkoutData } = useWorkout();

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

  return (
    <div className="relative  h-screen flex flex-1 flex-col justify-between">
      <div>
        <ExerciseList />
        <ExerciseDetails />
        <SetList routine={routine} />
      </div>
      <RestTimeTracker />
    </div>
  );
}
