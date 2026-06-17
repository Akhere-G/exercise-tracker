"use client";
import { Routine } from "@/src/features/routines/types";
import { Workout, WorkoutStats } from "@/src/features/workout/types";
import {
  getWorkoutDistance,
  getWorkoutDuration,
  getWorkoutPace,
  getWorkoutReps,
  getWorkoutVolume,
} from "@/src/features/workout/utils";
import ExerciseStat from "../../../components/ExerciseStat";
import { BicepsFlexed, Gauge, Route, Tally5, Timer } from "lucide-react";
import ProgressChart from "../../../components/ProgressCharts";
import ZoneBar from "../../../components/ZoneBar";

export default function RoutineStats({
  workouts,
}: {
  routine: Routine;
  workouts: Workout[];
  stats: WorkoutStats;
}) {
  const allSets = workouts.flatMap((workout) => workout.sets);

  const volumeData = workouts.map((workout) => ({
    y: getWorkoutVolume(workout.sets),
    x: new Date(workout.completedAt).toLocaleDateString(),
  }));

  const weightData = workouts.map((workout) => {
    const maxWeight =
      workout.sets.length > 0
        ? Math.max(...workout.sets.map((s) => s.weight || 0))
        : 0;
    return {
      y: maxWeight,
      x: new Date(workout.completedAt).toLocaleDateString(),
    };
  });

  // Epley Formula for Estimated 1RM per workout: Weight * (1 + Reps / 30)
  const e1rmData = workouts.map((workout) => {
    const max1rm =
      workout.sets.length > 0
        ? Math.max(
            ...workout.sets.map(
              (s) => (s.weight || 0) * (1 + (s.reps || 0) / 30),
            ),
          )
        : 0;
    return {
      y: Math.round(max1rm),
      x: new Date(workout.completedAt).toLocaleDateString(),
    };
  });

  const durationData = workouts.map((workout) => ({
    y: getWorkoutDuration(workout.sets),
    x: new Date(workout.completedAt).toLocaleDateString(),
  }));

  const repsData = workouts.map((workout) => ({
    y: getWorkoutReps(workout.sets),
    x: new Date(workout.completedAt).toLocaleDateString(),
  }));

  const distanceData = workouts.map((workout) => ({
    y: getWorkoutDistance(workout.sets),
    x: new Date(workout.completedAt).toLocaleDateString(),
  }));

  const paceData = workouts.map((workout) => ({
    y: getWorkoutPace(workout.sets),
    x: new Date(workout.completedAt).toLocaleDateString(),
  }));

  const maxVolume = Math.max(...volumeData.map((d) => d.y), 0);
  const maxWeight = Math.max(...weightData.map((d) => d.y), 0);
  const maxDuration = Math.max(...durationData.map((d) => d.y), 0);
  const maxReps = Math.max(...repsData.map((d) => d.y), 0);
  const maxDistance = Math.max(...distanceData.map((d) => d.y), 0);
  const maxPace = Math.max(...paceData.map((d) => d.y), 0);

  const totalWeightSets = allSets.filter(
    (s) => s.weight !== undefined && s.reps,
  ).length;
  const strengthSets = allSets.filter(
    (s) => (s.reps || 0) > 0 && (s.reps || 0) <= 5,
  ).length;
  const hypertrophySets = allSets.filter(
    (s) => (s.reps || 0) >= 6 && (s.reps || 0) <= 12,
  ).length;
  const enduranceSets = allSets.filter((s) => (s.reps || 0) >= 13).length;

  return (
    <div className="container">
      <div className="flex flex-wrap gap-4 mb-6">
        {maxVolume > 0 && (
          <ExerciseStat
            Icon={BicepsFlexed}
            title={maxVolume}
            subtitle="Max Volume"
          />
        )}
        {maxWeight > 0 && (
          <ExerciseStat
            Icon={BicepsFlexed}
            title={maxWeight + "kg"}
            subtitle="Max Weight"
          />
        )}
        {maxDuration > 0 && (
          <ExerciseStat
            Icon={Timer}
            title={maxDuration}
            subtitle="Max Duration"
          />
        )}
        {maxReps > 0 && (
          <ExerciseStat Icon={Tally5} title={maxReps} subtitle="Max Reps" />
        )}
        {maxDistance > 0 && (
          <ExerciseStat
            Icon={Route}
            title={maxDistance}
            subtitle="Max Distance (m)"
          />
        )}
        {maxPace > 0 && (
          <ExerciseStat
            Icon={Gauge}
            title={maxPace}
            subtitle="Max pace (mins/Km)"
          />
        )}
      </div>

      <div className="flex flex-col gap-6">
        {maxWeight > 0 && (
          <>
            <ProgressChart data={e1rmData} title="Estimated 1RM (kg)" />
            <ProgressChart data={weightData} title="Peak Load (kg)" />
          </>
        )}
        <ProgressChart data={volumeData} title="Volume" />
        <ProgressChart data={durationData} title="Duration (Mins)" />
        <ProgressChart data={repsData} title="Reps" />
        <ProgressChart data={distanceData} title="Distance (m)" />
        <ProgressChart data={paceData} title="Pace (mins/Km)" />

        {totalWeightSets > 0 && (
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <h2 className="text-xl mb-4 font-semibold">Repetition Zones</h2>
            <div className="flex flex-col gap-3">
              <ZoneBar
                label="Strength (1-5)"
                count={strengthSets}
                total={totalWeightSets}
              />
              <ZoneBar
                label="Hypertrophy (6-12)"
                count={hypertrophySets}
                total={totalWeightSets}
              />
              <ZoneBar
                label="Endurance (13+)"
                count={enduranceSets}
                total={totalWeightSets}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
