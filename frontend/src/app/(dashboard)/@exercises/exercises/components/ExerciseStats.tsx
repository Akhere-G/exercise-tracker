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
import ZoneBar from "../../../components/ZoneBar";

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
    y: Math.max(...groupedSets[date].map((s) => s.weight || 0)),
    x: date,
  }));

  // Epley Formula for Estimated 1RM: Weight * (1 + Reps / 30)
  const e1rmData = Object.keys(groupedSets).map((date) => {
    const max1rm = Math.max(
      ...groupedSets[date].map(
        (s) => (s.weight || 0) * (1 + (s.reps || 0) / 30),
      ),
    );
    return {
      y: Math.round(max1rm),
      x: date,
    };
  });

  const durationData = Object.keys(groupedSets).map((date) => ({
    y: getWorkoutDuration(groupedSets[date]),
    x: date,
  }));

  const repsData = Object.keys(groupedSets).map((date) => ({
    y: getWorkoutReps(groupedSets[date]),
    x: date,
  }));

  const maxWeight = Math.max(...sets.map((s) => s.weight || 0));
  const maxDuration = Math.max(...durationData.map((d) => d.y));
  const maxReps = Math.max(...repsData.map((d) => d.y));

  const totalWeightSets = sets.filter(
    (s) => s.weight !== undefined && s.reps,
  ).length;
  const strengthSets = sets.filter(
    (s) => (s.reps || 0) > 0 && (s.reps || 0) <= 5,
  ).length;
  const hypertrophySets = sets.filter(
    (s) => (s.reps || 0) >= 6 && (s.reps || 0) <= 12,
  ).length;
  const enduranceSets = sets.filter((s) => (s.reps || 0) >= 13).length;

  return (
    <div className="container">
      <div className="flex flex-wrap gap-4 mb-6">
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

      <div className="flex flex-col gap-6">
        {isWeightsExercise(exercise) && (
          <>
            <ProgressChart data={e1rmData} title="Estimated 1RM (kg)" />
            <ProgressChart data={weightData} title="Peak Load (kg)" />
            <ProgressChart data={volumeData} title="Total Volume" />

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
          </>
        )}

        {isRepsExercise(exercise) && !isWeightsExercise(exercise) && (
          <ProgressChart data={repsData} title="Reps" />
        )}
        {isDurationExercise(exercise) && (
          <ProgressChart data={durationData} title="Duration (Mins)" />
        )}
      </div>
    </div>
  );
}
