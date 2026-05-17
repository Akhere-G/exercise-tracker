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
import { createRoutine } from "@/src/features/routines/api";
import { RoutineSchema, routineSchema } from "@/src/features/routines/schema";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Exercise } from "@/src/features/exercises/types";
import { RoutineItemsTable } from "../components/RoutineItemsTable";
import { ExercisePickerModal } from "../components/ExercisePickerModal";
import { useRouter } from "next/navigation";

export default function ActiveWorkout() {
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
      await createRoutine(data);
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
        // TODO: add toast error message
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

  return (
    <div className="container relative">
      <Card>
        <CardHeader>
          <CardTitle className="title mb-2">Create Routine</CardTitle>
        </CardHeader>
        <CardContent>
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

            <div className="flex gap-4 justify-between">
              {days.map((day) => (
                <Button
                  className="w-15 h-15 rounded-full"
                  key={day.value}
                  type="button"
                  onClick={() => setValue("day", day.value)}
                  variant={values.day === day.value ? "default" : "ghost"}
                >
                  {day.title}
                </Button>
              ))}
            </div>

            <div className="flex flex-col gap-2 my-2">
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
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(true)}
            >
              Add Exercise
            </Button>

            <Button type="submit">Create</Button>
          </form>
        </CardContent>
      </Card>

      <ExercisePickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleAddExerciseToForm}
        addedExercises={values.routineItems}
      />
    </div>
  );
}
