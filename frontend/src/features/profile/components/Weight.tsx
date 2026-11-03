"use client";
import { Exercise as BaseExercise } from "@/src/features/exercises/types";
import { Exercise } from "@/src/features/workout/store";
import { WorkoutSetSchema } from "@/src/features/workout/schema";
import { getSetVolume, getVolume } from "@/src/features/workout/utils";
import { formatWeight } from "@/src/lib/units";
import { useWeightUnit } from "./ProfileProvider";

/** A weight stored in kg, shown in the user's preferred unit. */
export function WeightText({ kg }: { kg: number }) {
  return <>{formatWeight(kg, useWeightUnit())}</>;
}

export function SetSummary({
  exercise,
  set,
}: {
  exercise: BaseExercise;
  set: WorkoutSetSchema;
}) {
  return <>{getSetVolume(exercise, set, useWeightUnit())}</>;
}

export function ExerciseVolume({ exercise }: { exercise: Exercise }) {
  return <>{getVolume(exercise, useWeightUnit())}</>;
}
