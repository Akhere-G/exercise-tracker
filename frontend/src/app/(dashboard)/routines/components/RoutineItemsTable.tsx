"use client";

import { Button } from "@/src/components/ui/button";
import { UseFormRegister, FieldErrors, Control } from "react-hook-form";
import {
  RoutineItemSchema,
  RoutineSchema,
} from "@/src/features/routines/schema";
import { Input } from "@/src/components/ui/input";
import TimeInput from "@/src/components/ui/timeInput";
import { Link2, Link2Off, Trash2 } from "lucide-react";
import {
  isDurationExercise,
  isRepsExercise,
} from "@/src/features/exercises/utils";
import { Exercise } from "@/src/features/exercises/types";
import { Controller } from "react-hook-form";

interface RoutineItemsTableProps {
  fields: RoutineItemSchema[];
  register: UseFormRegister<RoutineSchema>;
  remove: (index: number) => void;
  errors: FieldErrors<RoutineSchema>;
  control: Control<RoutineSchema>;
  /** Current form values, so superset links reflect edits straight away. */
  items: RoutineItemSchema[];
  onToggleSuperset: (index: number) => void;
}

export function RoutineItemsTable({
  fields,
  register,
  remove,
  errors,
  control,
  items,
  onToggleSuperset,
}: RoutineItemsTableProps) {
  return (
    <div>
      {fields.length === 0 ? (
        <div>
          <h2 className="text-center">No Exercises</h2>
        </div>
      ) : (
        <div className="flex flex-col gap-4 my-4">
          {fields.map((field, index) => {
            const exercise = field.exercise;
            const hasReps = exercise
              ? isRepsExercise(exercise as Exercise)
              : false;

            const hasDuration = exercise
              ? isDurationExercise(exercise as Exercise)
              : false;

            const group = items[index]?.supersetGroup ?? null;
            const nextGroup = items[index + 1]?.supersetGroup ?? null;
            const isLinkedToNext = group !== null && group === nextGroup;
            const hasNext = index < fields.length - 1;

            return (
              <div
                key={field.exerciseId}
                className="card-custom p-4 bg-muted/20 rounded-lg flex flex-col gap-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded mt-0.5">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-sm truncate">
                      {exercise?.name || "Unknown"}
                    </span>
                    {group !== null && (
                      <span className="text-[10px] uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded mt-0.5">
                        Superset {group}
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center items-center pt-2 border-t border-border/50">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase text-muted-foreground">
                      Sets
                    </label>
                    <Input
                      type="number"
                      className={`text-center ${
                        errors.routineItems?.[index]?.targetSets?.message
                          ? "border border-error!"
                          : ""
                      }`}
                      {...register(`routineItems.${index}.targetSets`)}
                    />
                  </div>

                  {hasReps && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase text-muted-foreground">
                        Reps
                      </label>
                      <Input
                        type="number"
                        className={`text-center ${
                          errors.routineItems?.[index]?.targetReps?.message
                            ? "border border-error!"
                            : ""
                        }`}
                        {...register(`routineItems.${index}.targetReps`)}
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase text-muted-foreground">
                      Rest (s)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={3600}
                      placeholder="Default"
                      className="text-center"
                      {...register(`routineItems.${index}.restSecs`)}
                    />
                  </div>

                  {hasDuration && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase text-muted-foreground">
                        Mins
                      </label>
                      <Controller
                        name={`routineItems.${index}.targetDuration`}
                        control={control}
                        render={({ field }) => (
                          <TimeInput
                            value={field.value ?? ""}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  )}
                </div>

                {hasNext && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="self-start"
                    onClick={() => onToggleSuperset(index)}
                  >
                    {isLinkedToNext ? (
                      <>
                        <Link2Off size={14} /> Unlink from next
                      </>
                    ) : (
                      <>
                        <Link2 size={14} /> Superset with next
                      </>
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
