"use client";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Check } from "lucide-react";
import { WorkoutSetSchema } from "@/src/features/workout/schema";
import { useWorkout } from "@/src/features/workout/store";
import { Routine } from "@/src/features/routines/types";
import {
  isDurationExercise,
  isRepsExercise,
  isWeightsExercise,
} from "@/src/features/exercises/utils";
import { getNewSet } from "@/src/features/workout/utils";

function SetInput({
  value,
  onChange,
}: {
  value: number | string;
  onChange?: (val: string) => void;
}) {
  return (
    <Input
      type="number"
      className="w-16 h-10 text-center font-medium  border-secondary-foreground focus:ring-2 focus:ring-blue-500"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}

interface SetRowProps {
  set: WorkoutSetSchema;
  hasReps: boolean;
  hasWeight: boolean;
  hasDuration: boolean;
}

function SetRow({ set, hasReps, hasWeight, hasDuration }: SetRowProps) {
  const { setWorkoutData, exercises, currentExerciseId } = useWorkout();

  const updateSetData = (name: keyof WorkoutSetSchema, value: string) => {
    setWorkoutData({
      exercises: exercises.map((e) =>
        e.id === currentExerciseId
          ? {
              ...e,
              sets: e.sets.map((s) =>
                s.setIndex === set.setIndex ? { ...s, [name]: value } : s,
              ),
            }
          : e,
      ),
    });
  };
  return (
    <tr className="group transition-colors">
      <td className="py-3 px-2 font-semibold text-secondary-foreground">
        {set.setIndex}
      </td>
      {hasReps && (
        <td>
          <SetInput
            value={set.reps ?? ""}
            onChange={(value) => updateSetData("reps", value)}
          />
        </td>
      )}
      {hasWeight && (
        <td>
          <SetInput
            value={set.weight ?? ""}
            onChange={(value) => updateSetData("weight", value)}
          />
        </td>
      )}
      {hasDuration && (
        <td>
          <SetInput
            value={set.durationSecs ?? ""}
            onChange={(value) => updateSetData("durationSecs", value)}
          />
        </td>
      )}
      <td className="py-3 px-2">
        <Button variant="ghost" className="h-10 w-10 p-0 hover:text-green-600">
          <Check size={18} />
        </Button>
      </td>
    </tr>
  );
}

export default function SetList({ routine }: { routine: Routine | null }) {
  const { exercises, currentExerciseId, setWorkoutData } = useWorkout();
  const currentExercise = exercises.find((e) => e.id === currentExerciseId);
  const sets = currentExercise?.sets ?? [];

  const hasReps = !!currentExercise && isRepsExercise(currentExercise);
  const hasDuration = !!currentExercise && isDurationExercise(currentExercise);
  const hasWeight = !!currentExercise && isWeightsExercise(currentExercise);

  const addSet = () => {
    if (!currentExercise) return;
    setWorkoutData({
      exercises: exercises.map((e) =>
        e.id === currentExerciseId
          ? { ...e, sets: e.sets.concat(getNewSet(e)) }
          : e,
      ),
    });
  };
  if (!currentExercise) return null;

  return (
    <div className="bg-secondary mt-4 text-secondary-foreground p-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-secondary-foreground font-medium uppercase tracking-wider text-xs text-left">
            <th className="pb-3 px-2">Set</th>
            {hasReps && <th className="pb-3 px-2">Reps</th>}
            {hasWeight && <th className="pb-3 px-2">kg</th>}
            {hasDuration && <th className="pb-3 px-2">Mins</th>}
            <th className="pb-3 px-2 w-16"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {sets.map((set) => (
            <SetRow
              key={`${set.exerciseId}_${set.setIndex}`}
              set={set}
              hasReps={hasReps}
              hasWeight={hasWeight}
              hasDuration={hasDuration}
            />
          ))}
        </tbody>
      </table>
      <Button className="w-full" onClick={addSet}>
        Add{" "}
      </Button>
    </div>
  );
}
