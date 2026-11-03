"use server";
import { api, handleApiError } from "@/src/lib/axios";
import type { Routine } from "./types";
import { ActionResponse } from "@/src/lib/apiTypes";
import { RoutineSchema } from "./schema";

export const createRoutine = async (
  routine: RoutineSchema,
): Promise<ActionResponse<Routine>> => {
  try {
    const formattedRoutine = {
      ...routine,
      routineItems: routine.routineItems.map((r) => ({
        ...r,
        targetDurationSecs: r.targetDuration ? r.targetDuration : undefined,
      })),
    };
    const response = await api.post<Routine>("/routines", formattedRoutine);

    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Routine>(err);
  }
};

export const editRoutine = async (
  routine: Partial<RoutineSchema>,
  routineId: number,
): Promise<ActionResponse<Routine>> => {
  try {
    const cleanedRoutine = {
      ...routine,
      day: routine.day?.toString(),
      routineItems: routine.routineItems?.map((item) => {
        const { exercise, targetDuration, ...pureItemFields } = item;
        return {
          ...pureItemFields,
          targetDurationSecs: targetDuration ? targetDuration : undefined,
        };
      }),
    };

    const response = await api.patch<Routine>(
      `/routines/${routineId}`,
      cleanedRoutine,
    );

    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Routine>(err);
  }
};

export const deleteRoutine = async (
  routineId: number,
): Promise<ActionResponse<number>> => {
  try {
    const response = await api.delete<number>(`/routines/${routineId}`);

    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<number>(err);
  }
};

export const createRoutineFromWorkout = async (
  workoutId: number,
  data: { name: string; day: number; startTime?: string },
): Promise<ActionResponse<Routine>> => {
  try {
    const response = await api.post<Routine>(
      `/routines/from-workout/${workoutId}`,
      data,
    );
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Routine>(err);
  }
};

export const syncRoutineFromWorkout = async (
  routineId: number,
  workoutId: number,
): Promise<ActionResponse<Routine>> => {
  try {
    const response = await api.put<Routine>(
      `/routines/${routineId}/sync-from-workout/${workoutId}`,
    );
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Routine>(err);
  }
};
