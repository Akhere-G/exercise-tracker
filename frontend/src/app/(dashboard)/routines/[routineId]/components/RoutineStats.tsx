"use client";
import { Routine } from "@/src/features/routines/types";
import { Workout, WorkoutStats } from "@/src/features/workout/types";
import {
  getWorkoutDuration,
  getWorkoutReps,
  getWorkoutVolume,
} from "@/src/features/workout/utils";
import ExerciseStat from "../../../components/ExerciseStat";
import { BicepsFlexed, Tally5, Timer } from "lucide-react";
import ProgressChart from "../../../components/ProgressCharts";

export default function RoutineStats({
  workouts,
}: {
  routine: Routine;
  workouts: Workout[];
  stats: WorkoutStats;
}) {
  const volumeData = workouts.map((workout) => ({
    y: getWorkoutVolume(workout.sets),
    x: new Date(workout.completedAt).toLocaleDateString(),
  }));

  const durationData = workouts.map((workout) => ({
    y: getWorkoutDuration(workout.sets),
    x: new Date(workout.completedAt).toLocaleDateString(),
  }));

  const repsData = workouts.map((workout) => ({
    y: getWorkoutReps(workout.sets),
    x: new Date(workout.completedAt).toLocaleDateString(),
  }));

  const maxVolume = Math.max(...volumeData.map((d) => d.y));
  const maxDuration = Math.max(...durationData.map((d) => d.y));
  const maxReps = Math.max(...repsData.map((d) => d.y));

  return (
    <div className="container">
      <div className="flex flex-wrap gap-4 mb-4">
        <ExerciseStat
          Icon={BicepsFlexed}
          title={maxVolume}
          subtitle="Max Volume"
        />
        <ExerciseStat
          Icon={Timer}
          title={maxDuration}
          subtitle="Max Duration"
        />
        <ExerciseStat Icon={Tally5} title={maxReps} subtitle="Max Reps" />
      </div>
      <ProgressChart data={volumeData} title="Volume" />
      <ProgressChart data={durationData} title="Duration (Cardio)" />
      <ProgressChart data={repsData} title="Reps" />
    </div>
  );
}
