"use server";
import { revalidatePath } from "next/cache";
import { api, handleApiError } from "@/src/lib/axios";
import { ActionResponse } from "@/src/lib/apiTypes";
import { Routine } from "../routines/types";
import { BuildRoutineSchema } from "./schema";
import { RoutinePreview } from "./types";

export const buildRoutine = async (
  request: BuildRoutineSchema,
): Promise<ActionResponse<RoutinePreview>> => {
  try {
    const response = await api.post<RoutinePreview>(
      "/ai/build-routine",
      request,
    );
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<RoutinePreview>(err);
  }
};

export const savePreview = async (
  preview: RoutinePreview,
): Promise<ActionResponse<Routine[]>> => {
  try {
    const routines = preview.routines.map((routine) => ({
      name: routine.name,
      day: routine.day,
      routineItems: routine.items.map((item, order) => ({
        exerciseId: item.exerciseId,
        targetSets: item.sets,
        targetReps: item.reps,
        restSecs: item.restSecs,
        supersetGroup: item.supersetGroup,
        order,
      })),
    }));
    const response = await api.post<Routine[]>("/routines/batch", routines);
    revalidatePath("/routines");
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Routine[]>(err);
  }
};
