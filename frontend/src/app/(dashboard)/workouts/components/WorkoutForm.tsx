"use client";

import { Button } from "@/src/components/ui/button";
import { FormInput } from "@/src/components/ui/formInput";
import { Exercise as BaseExercise } from "@/src/features/exercises/types";

import {
  workoutSchema,
  WorkoutSchema,
  WorkoutSetSchema,
} from "@/src/features/workout/schema";
import { getDefaultSets, sameMetrics } from "@/src/features/workout/utils";
import { Workout } from "@/src/features/workout/types";
import { ExercisePickerModal } from "../../routines/components/ExercisePickerModal";
import { ActionResponse } from "@/src/lib/apiTypes";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import ExerciseSection from "./ExerciseSection";
import { FormSetRow } from "./types";
import {
  buildDefaultSet,
  buildSetsFromWorkout,
  groupByExercise,
  toDatetimeLocal,
} from "./workoutFormUtils";

export default function WorkoutForm({
  submitAction,
  submitText,
  initialData,
}: {
  submitAction: (data: WorkoutSchema) => Promise<ActionResponse<Workout>>;
  submitText: string;
  initialData?: Workout;
}) {
  const router = useRouter();
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);

  const { register, handleSubmit, formState, control, setValue, watch } =
    useForm({
      resolver: yupResolver(workoutSchema),
      defaultValues: {
        routineId: null,
        completedAt: new Date(),
        duration: 0,
        sets: [],
      },
    });

  const completedAtValue = watch("completedAt");

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "sets",
  });

  const watchedSets = useWatch({ control, name: "sets" }) as FormSetRow[];

  useEffect(() => {
    if (!initialData) return;

    setValue("routineId", initialData.routineId ?? null);
    setValue(
      "completedAt",
      initialData.completedAt ? new Date(initialData.completedAt) : new Date(),
    );
    setValue("duration", initialData.duration ?? 0);

    const rows = buildSetsFromWorkout(initialData);
    setValue("sets", rows as WorkoutSetSchema[]);
  }, [initialData, setValue]);

  const currentSets: FormSetRow[] = fields.map((f, i) => ({
    ...(watchedSets[i] ?? f),

    exercise: (f as unknown as FormSetRow).exercise,
  }));

  const groups = groupByExercise(currentSets);

  const handleUpdateSet = (
    fieldIndex: number,
    key: keyof WorkoutSetSchema,
    value: string | number,
  ) => {
    const existing = currentSets[fieldIndex];
    update(fieldIndex, { ...existing, [key]: value } as WorkoutSetSchema);
  };

  const handleAddSet = (exerciseId: number) => {
    const exerciseSets = currentSets.filter((s) => s.exerciseId === exerciseId);
    const exercise = exerciseSets[0]?.exercise;
    if (!exercise) return;
    const nextIndex = exerciseSets.length + 1;
    const newSet: FormSetRow = {
      ...buildDefaultSet(exercise, nextIndex),
      exercise,
    };
    append(newSet as unknown as WorkoutSetSchema);
  };

  const handleRemoveLastSet = (exerciseId: number) => {
    const indices = currentSets
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.exerciseId === exerciseId)
      .map(({ i }) => i);
    if (indices.length === 0) return;
    remove(indices[indices.length - 1]);
  };

  const handleRemoveExercise = (exerciseId: number) => {
    const indices = currentSets
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.exerciseId === exerciseId)
      .map(({ i }) => i);

    [...indices].reverse().forEach((i) => remove(i));
  };

  const handleReplaceExercise = (
    oldExerciseId: number,
    newExercise: BaseExercise,
  ) => {
    const indices = currentSets
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.exerciseId === oldExerciseId)
      .map(({ i }) => i);

    if (indices.length === 0) return;

    const oldExercise = currentSets[indices[0]].exercise;
    const keepSets = sameMetrics(oldExercise, newExercise);

    if (keepSets) {
      indices.forEach((i) => {
        const existing = currentSets[i];
        update(i, {
          ...existing,
          exerciseId: newExercise.id,
          exercise: newExercise,
        } as unknown as WorkoutSetSchema);
      });
    } else {
      const defaultSets = getDefaultSets(newExercise).map(
        (s, idx): FormSetRow => ({
          exerciseId: newExercise.id,
          setIndex: idx + 1,
          reps: s.reps ?? undefined,
          weight: s.weight ?? undefined,
          durationSecs: s.durationSecs ?? undefined,
          distanceMeters: s.distanceMeters ?? undefined,
          exercise: newExercise,
        }),
      );

      const firstIndex = indices[0];
      [...indices].reverse().forEach((i) => remove(i));

      defaultSets.forEach((s) => append(s as unknown as WorkoutSetSchema));
      void firstIndex;
    }
  };

  const handleAddExercises = (exercises: BaseExercise[]) => {
    for (const exercise of exercises) {
      if (currentSets.some((s) => s.exerciseId === exercise.id)) continue;

      const defaults = getDefaultSets(exercise);
      defaults.forEach((s, idx) => {
        const row: FormSetRow = {
          exerciseId: exercise.id,
          setIndex: idx + 1,
          reps: s.reps ?? undefined,
          weight: s.weight ?? undefined,
          durationSecs: s.durationSecs ?? undefined,
          distanceMeters: s.distanceMeters ?? undefined,
          exercise,
        };
        append(row as unknown as WorkoutSetSchema);
      });
    }
    setIsExerciseModalOpen(false);
  };

  const onSubmit = async (data: WorkoutSchema) => {
    try {
      const response = await submitAction(data);
      if (response.success) {
        router.push(`/workouts/summary/${response.data.id}`);
      } else {
        toast.error(response.error);
      }
    } catch {
      toast.error("Something went wrong.");
    }
  };

  const addedExercises: BaseExercise[] = groups.map((g) => g.exercise);

  return (
    <>
      <form className="form" onSubmit={handleSubmit(onSubmit)}>
        {/* ts-ignore */}
        <FormInput
          id="completedAt"
          label="Completed At"
          type="datetime-local"
          value={toDatetimeLocal(completedAtValue)}
          onChange={(e) =>
            setValue(
              "completedAt",
              e.target.value ? new Date(e.target.value) : new Date(),
            )
          }
          error={formState.errors.completedAt?.message}
        />
        <FormInput
          id="duration"
          label="Duration (minutes)"
          type="number"
          {...register("duration", { valueAsNumber: true })}
          error={formState.errors.duration?.message}
        />
        <div className="flex flex-col gap-6 my-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Exercises</h3>
          </div>

          {formState.errors.sets?.message && (
            <p className="text-sm text-error">
              {formState.errors.sets.message}
            </p>
          )}

          {groups.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No exercises added yet.
            </p>
          )}

          {groups.map((group) => (
            <ExerciseSection
              key={group.exercise.id}
              group={group}
              allSets={currentSets}
              onUpdateSet={handleUpdateSet}
              onAddSet={handleAddSet}
              onRemoveLastSet={handleRemoveLastSet}
              onRemoveExercise={handleRemoveExercise}
              onReplaceExercise={handleReplaceExercise}
              addedExercises={addedExercises}
            />
          ))}

          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsExerciseModalOpen(true)}
          >
            Add Exercise
          </Button>

          <Button type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Saving…" : submitText}
          </Button>
        </div>
      </form>

      <ExercisePickerModal
        isOpen={isExerciseModalOpen}
        onClose={() => setIsExerciseModalOpen(false)}
        onSelect={handleAddExercises}
        addedExercises={addedExercises}
      />
    </>
  );
}
