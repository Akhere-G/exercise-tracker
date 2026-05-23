"use client";
import React, { useEffect } from "react";
import ExercliseList from "./ExercliseList";
import ExerciseDetails from "./ExerciseDetails";
import SetList from "./SetList";
import RestTimeTracker from "./RestTimeTracker";
import { Routine } from "@/src/features/routines/types";
import { useWorkout } from "@/src/features/workout/store";

export default function WorkoutClientProvider({
  routine,
}: {
  routine: Routine | null;
}) {
  const { setRoutineData } = useWorkout();

  useEffect(() => {
    if (routine) {
      setRoutineData({ routineId: routine.id });
    }
  }, [routine, setRoutineData]);

  return (
    <div>
      <ExercliseList routine={routine} />
      <ExerciseDetails routine={routine} />
      <SetList routine={routine} />
      <RestTimeTracker routine={routine} />
    </div>
  );
}
