"use client";
import { Routine } from "@/src/features/routines/types";
import { Workout, WorkoutStats } from "@/src/features/workout/types";
import {
  getTotalVolume,
  getVolume,
  getWorkoutDuration,
  getWorkoutReps,
  getWorkoutVolume,
} from "@/src/features/workout/utils";
import { LineChart, Line, XAxis, YAxis } from "recharts";
import ExerciseStat from "../../../components/ExerciseStat";
import { BicepsFlexed, Tally5, Timer } from "lucide-react";

export default function RoutineStats({
  workouts,
}: {
  routine: Routine;
  workouts: Workout[];
  stats: WorkoutStats;
}) {
  const volumeData = workouts.map((workout) => ({
    y: getWorkoutVolume(workout),
    x: new Date(workout.completedAt).toLocaleDateString(),
  }));

  const durationData = workouts.map((workout) => ({
    y: getWorkoutDuration(workout),
    x: new Date(workout.completedAt).toLocaleDateString(),
  }));

  const repsData = workouts.map((workout) => ({
    y: getWorkoutReps(workout),
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

function ProgressChart({
  data,
  title,
}: {
  data: { x: number | string; y: number | string }[];
  title: string;
}) {
  return (
    <div>
      <h2 className="text-xl mb-4">{title}</h2>

      <LineChart
        style={{
          width: "100%",
          maxWidth: "700px",
          height: "100%",
          maxHeight: "70vh",
          aspectRatio: 1.618,
          stroke: "var(--color-secondary-foreground)",
        }}
        responsive
        data={data}
        margin={{
          top: 5,
          right: 5,
          left: 0,
          bottom: 5,
        }}
      >
        <XAxis dataKey="x" stroke="var(--color-secondary-foreground)" />
        <YAxis
          dataKey="y"
          width="auto"
          stroke="var(--color-secondary-foreground)"
        />
        <Line type="monotone" dataKey="y" stroke="var(--color-primary)" />
      </LineChart>
    </div>
  );
}
