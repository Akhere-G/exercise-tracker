"use client";
import React, { useEffect } from "react";

import ExerciseDetails from "./ExerciseDetails";
import SetList from "./SetList";
import RestTimeTracker from "./RestTimeTracker";
import { Routine } from "@/src/features/routines/types";
import { Exercise, useWorkout } from "@/src/features/workout/store";
import ExerciseList from "./ExerciseList";
import { Metrics, MetricsType } from "@/src/features/exercises/schemas";

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
        const { exercise, targetSets, targetReps } = item;

        const exerciseItem: Exercise = { ...exercise, sets: [] };

        const hasReps = (
          [MetricsType.REPS, MetricsType.REPS_WEIGHT] as Metrics[]
        ).includes(exercise.metrics);

        for (let i = 0; i < targetSets; i++) {
          exerciseItem.sets.push({
            exerciseId: exerciseItem.id,
            setIndex: i,
            reps: hasReps ? targetReps : undefined,
          });
        }

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
    <div>
      <ExerciseList routine={routine} />
      <ExerciseDetails routine={routine} />
      <SetList routine={routine} />
      <RestTimeTracker routine={routine} />
    </div>
  );
}
