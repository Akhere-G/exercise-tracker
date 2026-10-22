"use client";
import { Button } from "@/src/components/ui/button";
import { FormInput } from "@/src/components/ui/formInput";

import { Exercise } from "@/src/features/exercises/types";
import { routineSchema, RoutineSchema } from "@/src/features/routines/schema";
import { yupResolver } from "@hookform/resolvers/yup";
import React, { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { RoutineItemsTable } from "./RoutineItemsTable";
import { ExercisePickerModal } from "./ExercisePickerModal";
import { useRouter } from "next/navigation";
import { Routine } from "@/src/features/routines/types";
import {
  toLocalSchedule,
  toUtcSchedule,
} from "@/src/features/routines/utils";
import { toast } from "sonner";
import { ActionResponse } from "@/src/lib/apiTypes";
import { getFailureReason, track } from "@/src/features/analytics/utils";

export default function RoutineForm({
  submitAction,
  sumbitText,
  initalData,
}: {
  submitAction: (data: RoutineSchema) => Promise<ActionResponse<Routine>>;
  sumbitText: string;
  initalData?: Routine;
}) {
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>(
    {},
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  const router = useRouter();
  const { register, formState, handleSubmit, setValue, watch, control } =
    useForm<RoutineSchema>({
      resolver: yupResolver(routineSchema),
      defaultValues: {
        day: 0,
        startTime: "12:00",
        routineItems: [],
      },
    });

  useEffect(() => {
    if (initalData) {
      setValue("name", initalData.name);
      const local = initalData.startTime
        ? toLocalSchedule(initalData.day, initalData.startTime)
        : null;
      setValue("startTime", local?.time ?? "");
      setValue("day", local?.day ?? initalData.day);
      setValue("routineItems", initalData.routineItems);
    }
  }, [initalData, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "routineItems",
  });

  const days = [
    { title: "Mon", value: 0 },
    { title: "Tues", value: 1 },
    { title: "Wed", value: 2 },
    { title: "Thurs", value: 3 },
    { title: "Fri", value: 4 },
    { title: "Sat", value: 5 },
    { title: "Sun", value: 6 },
  ];

  const onSubmit = async (data: RoutineSchema) => {
    try {
      setErrorMessages({});
      const response = await submitAction({
        ...data,
        ...toUtcSchedule(data.day, data.startTime),
      });
      if (response.success) {
        if (!initalData) {
          track("create_routine", {
            routine_id: response.data.id,
            exercise_count: data.routineItems.length,
            day: data.day,
            has_duration_target: data.routineItems.some(
              (item) => (item.targetDuration ?? 0) > 0,
            ),
          });
        }
        router.push("/routines");
      } else {
        if (!initalData) {
          track("create_routine_failed", {
            reason: getFailureReason(response),
          });
        }
        // TODO: setErrorMessages(response.);
        toast.error(response.error);
      }
    } catch (err) {
      if (!initalData) {
        track("create_routine_failed", { reason: "exception" });
      }
      console.error(err);
    }
  };

  const values = watch();

  const handleAddExerciseToForm = (exercises: Exercise[]) => {
    for (const exercise of exercises) {
      if (fields.some((e) => e.exerciseId === exercise.id)) {
        continue;
      }
      append({
        exercise: exercise,
        exerciseId: exercise.id,
        targetSets: 3,
        targetReps: null,
        targetDuration: null,
        order: fields.length,
      });
    }
    setIsModalOpen(false);
  };

  const exercises: Exercise[] = values.routineItems.map(
    (r) => r.exercise,
  ) as Exercise[];

  return (
    <>
      <form className="form" onSubmit={handleSubmit(onSubmit)}>
        {Object.keys(errorMessages).length > 0 && (
          <p className="text-error whitespace-pre-line">
            {Object.values(errorMessages).join("\n")}
          </p>
        )}

        <FormInput
          id="name"
          label="Name"
          {...register("name")}
          error={formState.errors.name?.message}
        />

        <FormInput
          id="startTime"
          label="Start Time"
          {...register("startTime")}
          type="time"
          error={formState.errors.startTime?.message}
        />

        <div className="grid grid-cols-7 content-center items-center justify-center gap-4">
          {days.map((day) => (
            <div key={day.value} className="flex justify-center">
              <Button
                className="w-10 h-10 md:w-15 md:h-15 rounded-full items-center"
                type="button"
                onClick={() => setValue("day", day.value)}
                variant={values.day === day.value ? "default" : "ghost"}
              >
                {day.title}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 my-2">
          <h3 className="text-sm font-medium">Selected Exercises</h3>
          {formState.errors.routineItems?.message && (
            <p className="text-sm text-error">
              {formState.errors.routineItems.message}
            </p>
          )}

          <RoutineItemsTable
            fields={fields}
            register={register}
            remove={remove}
            errors={formState.errors}
            control={control}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsModalOpen(true)}
          >
            Add Exercise
          </Button>

          <Button type="submit">{sumbitText}</Button>
        </div>
      </form>

      <ExercisePickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleAddExerciseToForm}
        addedExercises={exercises}
      />
    </>
  );
}
