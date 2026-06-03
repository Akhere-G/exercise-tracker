"use server";
import { api } from "@/src/lib/axios";
import type { Routine } from "./types";
import { ActionResponse } from "@/src/lib/apiTypes";
import { RoutineSchema } from "./schema";
import { isAxiosError } from "axios";

export const createRoutine = async (
  routine: RoutineSchema,
): Promise<ActionResponse<Routine>> => {
  try {
    const formattedRoutine = {
      ...routine,
      routineItems: routine.routineItems.map((r) => ({
        ...r,
        targetDurationSecs: r.targetDuration
          ? r.targetDuration * 60
          : undefined,
      })),
    };
    const response = await api.post<Routine>("/routines", formattedRoutine);

    return { success: true, data: response.data };
  } catch (err) {
    if (isAxiosError(err)) {
      return {
        success: false,
        errors: err.response?.data.detail,
      };
    }
    return {
      success: false,
      error: "An unexpected error occured",
    };
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
          targetDurationSecs: targetDuration ? targetDuration * 60 : undefined,
        };
      }),
    };

    const response = await api.patch<Routine>(
      `/routines/${routineId}`,
      cleanedRoutine,
    );

    return { success: true, data: response.data };
  } catch (err) {
    if (isAxiosError(err)) {
      return {
        success: false,
        errors: err.response?.data.detail,
      };
    }
    return {
      success: false,
      error: "An unexpected error occured",
    };
  }
};

export const deleteRoutine = async (
  routineId: number,
): Promise<ActionResponse<number>> => {
  try {
    const response = await api.delete<number>(`/routines/${routineId}`);

    return { success: true, data: response.data };
  } catch (err) {
    if (isAxiosError(err)) {
      return {
        success: false,
        errors: err.response?.data.detail,
      };
    }
    return {
      success: false,
      error: "An unexpected error occured",
    };
  }
};
