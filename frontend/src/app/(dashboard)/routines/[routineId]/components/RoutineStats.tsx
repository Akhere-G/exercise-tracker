"use client";
import { Routine } from "@/src/features/routines/types";
import { Workout, WorkoutStats } from "@/src/features/workout/types";
import {
  getWorkoutDistance,
  getWorkoutDuration,
  getWorkoutPace,
  getWorkoutReps,
  getWorkoutVolume,
  isWorkingSet,
} from "@/src/features/workout/utils";
import { getEstimatedOneRepMax } from "@/src/features/exercises/utils";
import ExerciseStat from "../../../components/ExerciseStat";
import { BicepsFlexed, Gauge, Route, Tally5, Timer } from "lucide-react";
import ProgressChart from "../../../components/ProgressCharts";
import ZoneBar from "../../../components/ZoneBar";
import { useWeightUnit } from "@/src/features/profile/components/ProfileProvider";
import { toDisplayWeight } from "@/src/lib/units";

export default function RoutineStats({
  workouts,
}: {
  routine: Routine;
  workouts: Workout[];
  stats: WorkoutStats;
}) {
  const unit = useWeightUnit();
  const allSets = workouts.flatMap((workout) => workout.sets);

  const volumeData = workouts.map((workout) => ({
    y: Math.round(toDisplayWeight(getWorkoutVolume(workout.sets), unit)),
    x: new Date(workout.completedAt).toLocaleDateString(),
  }));

  const weightData = workouts.map((workout) => {
    const maxWeight = Math.max(
      0,
      ...workout.sets.filter(isWorkingSet).map((s) => s.weight || 0),
    );
    return {
      y: toDisplayWeight(maxWeight, unit),
      x: new Date(workout.completedAt).toLocaleDateString(),
    };
  });

  const e1rmData = workouts.map((workout) => {
    const max1rm = getEstimatedOneRepMax(workout.sets);
    return {
      y: Math.round(toDisplayWeight(max1rm, unit)),
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
            title={`${maxWeight} ${unit}`}
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
            title={maxPace.toFixed(2)}
            subtitle="Max pace (mins/Km)"
          />
        )}
      </div>

      <div className="flex flex-col gap-6">
        {maxWeight > 0 && (
          <>
            <ProgressChart data={e1rmData} title={`Estimated 1RM (${unit})`} />
            <ProgressChart data={weightData} title={`Peak Load (${unit})`} />
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
