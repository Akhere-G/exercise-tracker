"use client";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Check } from "lucide-react";
import { ActiveSet, Exercise, useWorkout } from "@/src/features/workout/store";
import { Routine, RoutineItem } from "@/src/features/routines/types";
import {
  isCardioExercise,
  isDurationExercise,
  isRepsExercise,
  isWeightsExercise,
} from "@/src/features/exercises/utils";
import { getNewSet, isExerciseCompleted } from "@/src/features/workout/utils";
import { useTimer } from "@/src/features/timer/store";
import { toast } from "sonner";
import { useState } from "react";

function SetInput({
  value,
  onChange,
  canBeZero,
  canBeNegative,
}: {
  value: number | string;
  onChange?: (val: string) => void;
  canBeZero?: boolean;
  canBeNegative?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [dirtyValue, setDirtyValue] = useState("");

  const updateValue = () => {
    if (Number(dirtyValue.trim()) || (dirtyValue.trim() === "0" && canBeZero)) {
      let value = dirtyValue;

      if (!canBeNegative) {
        value = Math.abs(Number(dirtyValue)).toString();
      }
      onChange?.(value);
      setDirtyValue(value);
    }
    setIsEditing(false);
  };
  return (
    <Input
      type="number"
      className="w-16 h-10 text-center font-medium bg-transparent! border-none placeholder-muted-foreground"
      placeholder={value.toString()}
      value={isEditing ? dirtyValue : value}
      onFocus={() => setIsEditing(true)}
      onChange={(e) => setDirtyValue(e.target.value)}
      onKeyDownCapture={(e) => {
        if (e.key == "Enter") {
          e.currentTarget.blur();
        }
      }}
      onBlur={updateValue}
    />
  );
}

interface SetRowProps {
  set: ActiveSet;
  hasReps: boolean;
  hasWeight: boolean;
  hasDuration: boolean;
  hasDistance: boolean;
}

function SetRow({
  set,
  hasReps,
  hasWeight,
  hasDuration,
  hasDistance,
}: SetRowProps) {
  const { setWorkoutData, exercises, currentExerciseId } = useWorkout();
  const { start, clear } = useTimer();

  const updateSetData = (name: keyof ActiveSet, value: string | boolean) => {
    const newExercises = exercises.map((e) =>
      e.id === currentExerciseId
        ? {
            ...e,
            sets: e.sets.map((s) =>
              s.setIndex === set.setIndex ? { ...s, [name]: value } : s,
            ),
          }
        : e,
    );
    setWorkoutData({
      exercises: newExercises,
    });

    return newExercises;
  };

  const checkIsCompleted = (exercises: Exercise[]) => {
    const currentExercise = exercises.find((e) => e.id === currentExerciseId);
    if (!currentExercise) return;

    const allSetsCompleted = isExerciseCompleted(currentExercise);

    if (allSetsCompleted) {
      const nextUnfinishedExercise = exercises.find(
        (e) => !isExerciseCompleted(e),
      );
      if (nextUnfinishedExercise) {
        setWorkoutData({ currentExerciseId: nextUnfinishedExercise.id });
      }
    }
  };

  function handleClick() {
    if (!set.isCompleted && Number(set.reps) < 1)
      return toast.error("Cannot complete set with reps less than 1.");

    const newExercises = updateSetData("isCompleted", !set.isCompleted);
    if (!set.isCompleted) {
      if (newExercises.some((e) => !isExerciseCompleted(e))) {
        start();
      } else {
        clear();
      }
    }
    checkIsCompleted(newExercises);
  }

  // TODO: Display previous workout data

  return (
    <tr
      className={`group transition-colors ${set.isCompleted ? "bg-success/50 " : ""}`}
    >
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
            canBeZero
            canBeNegative
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
      {hasDistance && (
        <td>
          <SetInput
            value={set.distanceMeters ?? ""}
            onChange={(value) => updateSetData("distanceMeters", value)}
          />
        </td>
      )}
      <td className="py-3 px-2">
        <Button
          variant="ghost"
          className={"h-10 w-10 p-0 hover:text-green-600"}
          onClick={handleClick}
        >
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
  const hasWeight = !!currentExercise && isWeightsExercise(currentExercise);
  const hasDuration = !!currentExercise && isDurationExercise(currentExercise);
  const hasDistance = !!currentExercise && isCardioExercise(currentExercise);

  const addSet = () => {
    if (!currentExercise) return;

    const routineItems: Record<number, RoutineItem> = {};
    routine?.routineItems.forEach((r) => {
      routineItems[r.exerciseId] = r;
    });

    setWorkoutData({
      exercises: exercises.map((e) =>
        e.id === currentExerciseId
          ? { ...e, sets: e.sets.concat(getNewSet(e, routineItems[e.id])) }
          : e,
      ),
    });
  };
  if (!currentExercise) return null;

  return (
    <div className="bg-secondary mt-4 text-secondary-foreground py-4 flex flex-col gap-4 max-h-[54vh] overflow-y-scroll">
      <table className="w-full text-sm">
        <thead className="table-header-group">
          <tr className="text-secondary-foreground font-medium uppercase tracking-wider text-xs text-left">
            <th className="pb-3 px-2">Set</th>
            {hasReps && <th className="pb-3 px-2">Reps</th>}
            {hasWeight && <th className="pb-3 px-2">kg</th>}
            {hasDuration && <th className="pb-3 px-2">Mins</th>}
            {hasDistance && <th className="pb-3 px-2">Meters</th>}
            <th className="pb-3 px-2 w-16"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-muted-foreground">
          {sets.map((set) => (
            <SetRow
              key={`${set.exerciseId}_${set.setIndex}`}
              set={set}
              hasReps={hasReps}
              hasWeight={hasWeight}
              hasDuration={hasDuration}
              hasDistance={hasDistance}
            />
          ))}
        </tbody>
      </table>
      <Button className=" mx-2" onClick={addSet}>
        Add{" "}
      </Button>
    </div>
  );
}
