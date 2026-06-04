import { Routine } from "@/src/features/routines/types";
import { Workout, WorkoutStats } from "@/src/features/workout/types";
import React from "react";

export default function RoutineStats({
  routine,
  workouts,
  stats,
}: {
  routine: Routine;
  workouts: Workout[];
  stats: WorkoutStats;
}) {
  return <div>RoutineStats</div>;
}
