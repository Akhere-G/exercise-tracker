import { Exercise } from "@/src/features/exercises/types";
import ProgressChart from "../../../components/ProgressCharts";
import {
  getWorkoutDuration,
  getWorkoutReps,
  getWorkoutVolume,
} from "@/src/features/workout/utils";
import { workoutSetWithDate } from "@/src/features/workout/types";
import {
  isDurationExercise,
  isRepsExercise,
  isWeightsExercise,
} from "@/src/features/exercises/utils";
import ExerciseStat from "../../../components/ExerciseStat";
import { BicepsFlexed, Tally5, Timer } from "lucide-react";

export default function ExerciseStats({
  exercise,
  groupedSets,
}: {
  exercise: Exercise;

  groupedSets: Record<string, workoutSetWithDate[]>;
}) {
  const sets = Object.values(groupedSets).flat();

  const volumeData = Object.keys(groupedSets).map((date) => ({
    y: getWorkoutVolume(groupedSets[date]),
    x: date,
  }));

  const weightData = Object.keys(groupedSets).map((date) => ({
    y: Math.max(...groupedSets[date].map((s) => s.weight!)),
    x: date,
  }));
  const durationData = Object.keys(groupedSets).map((date) => ({
    y: getWorkoutDuration(groupedSets[date]),
    x: date,
  }));

  const repsData = Object.keys(groupedSets).map((date) => ({
    y: getWorkoutReps(groupedSets[date]),
    x: date,
  }));

  const maxWeight = Math.max(...sets.map((s) => s.weight!));
  const maxDuration = Math.max(...durationData.map((d) => d.y));
  const maxReps = Math.max(...repsData.map((d) => d.y));

  return (
    <div className="container">
      <div className="flex flex-wrap gap-4 mb-4">
        {isWeightsExercise(exercise) && (
          <ExerciseStat
            Icon={BicepsFlexed}
            title={maxWeight + "kg"}
            subtitle="Max Weight"
          />
        )}
        {isDurationExercise(exercise) && (
          <ExerciseStat
            Icon={Timer}
            title={maxDuration}
            subtitle="Max Duration"
          />
        )}
        {isRepsExercise(exercise) && (
          <ExerciseStat Icon={Tally5} title={maxReps} subtitle="Max Reps" />
        )}
      </div>
      <div className="flex flex-col gap-2">
        {isWeightsExercise(exercise) && (
          <ProgressChart data={volumeData} title="Volume" />
        )}
        {isWeightsExercise(exercise) && (
          <ProgressChart data={weightData} title="Max Weight" />
        )}
        {isRepsExercise(exercise) && (
          <ProgressChart data={repsData} title="Reps" />
        )}
        {isDurationExercise(exercise) && (
          <ProgressChart data={durationData} title="Duration (Cardio)" />
        )}
      </div>
    </div>
  );
}
