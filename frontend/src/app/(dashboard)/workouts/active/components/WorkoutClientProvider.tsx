"use client";
import React, { useEffect } from "react";
import ExercliseList from "./ExercliseList";
import ExerciseDetails from "./ExerciseDetails";
import SetList from "./SetList";
import RestTimeTracker from "./RestTimeTracker";
import { Routine } from "@/src/features/routines/types";
const workoutKey = "active_workout_start_time";

export default function WorkoutClientProvider({
  routine,
}: {
  routine: Routine | null;
}) {
  useEffect(() => {
    let workoutStartTime = localStorage.getItem(workoutKey);
    if (!workoutStartTime) {
      workoutStartTime = new Date().toISOString();
      localStorage.setItem(workoutKey, workoutStartTime);
    }
  }, []);

  return (
    <div>
      <ExercliseList />
      <ExerciseDetails />
      <SetList />
      <RestTimeTracker />
    </div>
  );
}
