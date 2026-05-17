"use client";

import { Button } from "@/src/components/ui/button";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import {
  RoutineItemSchema,
  RoutineSchema,
} from "@/src/features/routines/schema";
import { Input } from "@/src/components/ui/input";
import { Trash2 } from "lucide-react";

interface RoutineItemsTableProps {
  fields: RoutineItemSchema[];
  register: UseFormRegister<RoutineSchema>;
  remove: (index: number) => void;
  errors: FieldErrors<RoutineSchema>;
}

export function RoutineItemsTable({
  fields,
  register,
  remove,
  errors,
}: RoutineItemsTableProps) {
  return (
    <div className="flex flex-col gap-2 my-4">
      <div className="grid grid-cols-12 gap-2 items-center px-4 py-2 text-xs font-semibold text-muted-foreground uppercase border-b border-border tracking-wider">
        <div className="col-span-6">Exercise</div>
        <div className="col-span-2 text-center">Sets</div>
        <div className="col-span-2 text-center">Reps</div>
        <div className="col-span-1 text-right"></div>
      </div>

      <div className="flex flex-col gap-2">
        {fields.length === 0 && (
          <div className="text-center pt-8">No exercises</div>
        )}
        {fields.map((field, index) => (
          <div
            key={field.exerciseId}
            className="grid grid-cols-12 gap-2 items-center card-custom p-3 bg-muted/20"
          >
            <div className="col-span-6 flex items-start gap-2 min-w-0">
              <span className="hidden md:block font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded mt-0.5">
                {index + 1}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm text-foreground truncate">
                  {field?.exercise?.name || "Unknown Exercise"}
                </span>
                <span className="text-xs text-muted-foreground truncate capitalize">
                  {field?.exercise?.muscles?.join(", ") ||
                    "No groups specified"}
                </span>
              </div>
            </div>

            <div className="col-span-2 flex justify-center ">
              <Input
                type="number"
                placeholder="Sets"
                className={` text-center text-xs ${
                  errors.routineItems?.[index]?.targetSets?.message
                    ? "border border-error!"
                    : ""
                }`}
                {...register(`routineItems.${index}.targetSets` as const)}
              />
            </div>

            <div className="col-span-2 flex justify-center">
              <Input
                type="number"
                placeholder="Reps"
                className={` text-center text-xs ${
                  errors.routineItems?.[index]?.targetReps?.message
                    ? "border border-error!"
                    : ""
                }`}
                {...register(`routineItems.${index}.targetReps` as const)}
              />
            </div>

            <div className="col-span-2 flex justify-end">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                title="delete"
                onClick={() => remove(index)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
