import { Routine } from "@/src/features/routines/types";
import { getDayStr } from "@/src/features/routines/utils";
import { Workout, WorkoutStats } from "@/src/features/workout/types";
import {
  getTotalTime,
  getTotalWorkoutsVolume,
} from "@/src/features/workout/utils";
import { BicepsFlexed, Dot, Flame, Timer, Weight } from "lucide-react";
import React from "react";
import ExerciseStat from "../../../components/ExerciseStat";
import RoutineItemCard from "../../../components/RoutineItemCard";
import BodyChart from "../../../workouts/summary/[workoutId]/components/BodyChart";
import { getMuscleMapData } from "@/src/features/exercises/utils";

export default function RoutineDetails({
  routine,
  workouts,
  stats,
}: {
  routine: Routine;
  workouts: Workout[];
  stats: WorkoutStats;
}) {
  const exercises = routine?.routineItems.map((r) => r.exercise) ?? [];

  const data = getMuscleMapData(exercises);

  return (
    <div className="container">
      <div className="flex flex-wrap gap-4">
        <ExerciseStat
          Icon={BicepsFlexed}
          title={workouts.length}
          subtitle="Workouts"
        />
        <ExerciseStat
          Icon={Weight}
          title={getTotalWorkoutsVolume(workouts) + " kg"}
          subtitle="Volume"
        />
        <ExerciseStat
          Icon={Timer}
          title={getTotalTime(workouts)}
          subtitle="Minutes"
        />
        <ExerciseStat
          Icon={Flame}
          title={stats?.weeklyStreak ?? "0"}
          subtitle="Streak"
        />
      </div>

      <div className="flex justify-center ">
        <BodyChart data={data} side="front" />
        <BodyChart data={data} side="back" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {routine.routineItems.map((routineItem) => (
          <RoutineItemCard
            key={routineItem.exerciseId}
            routineItem={routineItem}
          />
        ))}
      </div>
    </div>
  );
}
