"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/card";
import { Button } from "@/src/components/ui/button";
import { FormInput } from "@/src/components/ui/formInput";
import {
  getValidationErrors,
  isValidationError,
} from "@/src/features/auth/utils";
import { Exercise } from "@/src/features/exercises/types";
import { routineSchema, RoutineSchema } from "@/src/features/routines/schema";
import { yupResolver } from "@hookform/resolvers/yup";
import React, { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { RoutineItemsTable } from "./RoutineItemsTable";
import { ExercisePickerModal } from "./ExercisePickerModal";
import { useRouter } from "next/navigation";
import { Routine } from "@/src/features/routines/types";

export default function RoutineForm({
  submitAction,
  sumbitText,
  initalData,
}: {
  submitAction: (data: RoutineSchema) => Promise<unknown>;
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
      setValue(
        "startTime",
        initalData.startTime ? initalData.startTime.substring(0, 5) : "",
      );
      setValue("day", initalData.day);
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
      await submitAction(data);
      router.push("/routines");
    } catch (err) {
      if (isValidationError(err)) {
        setErrorMessages(getValidationErrors(err.error));
      }
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
        targetReps: 10,
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
