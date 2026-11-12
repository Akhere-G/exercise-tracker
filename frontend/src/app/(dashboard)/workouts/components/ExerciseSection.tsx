"use client";

import { Button } from "@/src/components/ui/button";
import { Exercise as BaseExercise } from "@/src/features/exercises/types";
import {
  isCardioExercise,
  isDurationExercise,
  isRepsExercise,
  isWeightsExercise,
} from "@/src/features/exercises/utils";
import { WorkoutSetSchema } from "@/src/features/workout/schema";
import { ExercisePickerModal } from "../../routines/components/ExercisePickerModal";

import { Dot, Minus, Plus, MoreVertical } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import SetInput from "./SetInput";
import TimeInput from "@/src/components/ui/timeInput";
import { useState } from "react";
import { ExerciseGroup, FormSetRow } from "./types";
import { useWeightUnit } from "@/src/features/profile/components/ProfileProvider";
import { toDisplayWeight, toKg } from "@/src/lib/units";
import { nextSetType } from "@/src/features/workout/utils";

export default function ExerciseSection({
  group,
  allSets,
  onUpdateSet,
  onAddSet,
  onRemoveLastSet,
  onRemoveExercise,
  onReplaceExercise,
  addedExercises,
}: {
  group: ExerciseGroup;
  allSets: FormSetRow[];
  onUpdateSet: (
    fieldIndex: number,
    key: keyof WorkoutSetSchema,
    value: string | number,
  ) => void;
  onAddSet: (exerciseId: number) => void;
  onRemoveLastSet: (exerciseId: number) => void;
  onRemoveExercise: (exerciseId: number) => void;
  onReplaceExercise: (oldExerciseId: number, newExercise: BaseExercise) => void;
  addedExercises: BaseExercise[];
}) {
  const { exercise, indices } = group;
  const sets = indices.map((i) => ({ ...allSets[i], fieldIndex: i }));

  const hasReps = isRepsExercise(exercise);
  const hasWeight = isWeightsExercise(exercise);
  const hasDuration = isDurationExercise(exercise);
  const hasDistance = isCardioExercise(exercise);

  const [replaceOpen, setReplaceOpen] = useState(false);
  const weightUnit = useWeightUnit();

  return (
    <div
      className="flex flex-col gap-3"
      role="group"
      aria-label={exercise.name}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{exercise.name}</h3>
          <div className="flex items-center">
            <p className="capitalize text-sm text-muted-foreground">
              {exercise.equipment}
            </p>
            <Dot width={16} />
            <p className="capitalize text-sm text-muted-foreground">
              {exercise.muscles.map((m) => m.name).join(", ")}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={`${exercise.name} options`}
            >
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setReplaceOpen(true)}>
              Replace Exercise
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onRemoveExercise(exercise.id)}
            >
              Remove Exercise
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="bg-secondary rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground font-medium uppercase tracking-wider text-xs text-left">
              <th className="pb-3 pt-3 px-3">Set</th>
              {hasWeight && <th className="pb-3 pt-3 px-2">{weightUnit}</th>}
              {hasReps && <th className="pb-3 pt-3 px-2">Reps</th>}
              {hasDuration && <th className="pb-3 pt-3 px-2">Mins</th>}
              {hasDistance && <th className="pb-3 pt-3 px-2">Meters</th>}
              <th className="pb-3 pt-3 px-2 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sets.map((set) => (
              <tr key={`${set.exerciseId}_${set.setIndex}`}>
                <td className="py-2 px-3 font-semibold text-muted-foreground">
                  <button
                    type="button"
                    title="Tap to change set type"
                    aria-label={`Set ${set.setIndex}, ${set.setType ?? "normal"}. Tap to change set type.`}
                    className={`w-6 text-left ${set.setType === "warmup" ? "text-warning" : set.setType === "drop" ? "text-info" : set.setType === "failure" ? "text-destructive" : ""}`}
                    onClick={() =>
                      onUpdateSet(
                        set.fieldIndex,
                        "setType",
                        nextSetType(set.setType),
                      )
                    }
                  >
                    {set.setType && set.setType !== "normal"
                      ? { warmup: "W", drop: "D", failure: "F" }[set.setType]
                      : set.setIndex}
                  </button>
                </td>
                {hasWeight && (
                  <td>
                    <SetInput
                      value={
                        set.weight == null
                          ? ""
                          : toDisplayWeight(Number(set.weight), weightUnit)
                      }
                      aria-label={`Set ${set.setIndex} weight`}
                      onChange={(v) =>
                        onUpdateSet(
                          set.fieldIndex,
                          "weight",
                          toKg(Number(v), weightUnit),
                        )
                      }
                      canBeZero
                      canBeNegative
                    />
                  </td>
                )}
                {hasReps && (
                  <td>
                    <SetInput
                      value={set.reps ?? ""}
                      aria-label={`Set ${set.setIndex} reps`}
                      onChange={(v) =>
                        onUpdateSet(set.fieldIndex, "reps", Number(v))
                      }
                    />
                  </td>
                )}
                {hasDuration && (
                  <td className=" w-30 ">
                    <TimeInput
                      className="bg-transparent! border-none max-w-fit"
                      value={set.durationSecs ?? ""}
                      aria-label={`Set ${set.setIndex} duration`}
                      onChange={(v) =>
                        onUpdateSet(set.fieldIndex, "durationSecs", Number(v))
                      }
                    />
                  </td>
                )}
                {hasDistance && (
                  <td>
                    <SetInput
                      value={set.distanceMeters ?? ""}
                      aria-label={`Set ${set.setIndex} distance`}
                      onChange={(v) =>
                        onUpdateSet(set.fieldIndex, "distanceMeters", Number(v))
                      }
                    />
                  </td>
                )}
                <td className="py-2 px-2" />
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex gap-2 px-3 pb-3 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={() => onAddSet(exercise.id)}
          >
            <Plus size={14} /> Add Set
          </Button>
          {sets.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs gap-1 text-muted-foreground"
              onClick={() => onRemoveLastSet(exercise.id)}
            >
              <Minus size={14} /> Remove Last
            </Button>
          )}
        </div>
      </div>

      <ExercisePickerModal
        isOpen={replaceOpen}
        onClose={() => setReplaceOpen(false)}
        onSelect={(exercises) => {
          if (exercises[0]) {
            onReplaceExercise(exercise.id, exercises[0]);
          }
          setReplaceOpen(false);
        }}
        addedExercises={addedExercises}
        selectMany={false}
        title="Replace Exercise"
        submitBtnText="Replace"
        defaultMuscle={exercise.muscles[0]?.name ?? ""}
      />
    </div>
  );
}
