"use server";
import { api } from "@/src/lib/axios";
import type { Routine } from "./types";
import { keysToCamel, keysToSnake } from "@/src/lib/apiUtils";
import { RoutineSchema } from "./schema";
import { isValidationError } from "../auth/utils";

export const getAllRoutines = async (): Promise<Routine[]> => {
  const response = await api.get<Routine[]>("/routines");
  return keysToCamel(response.data);
};

export const getRoutineById = async (id: number): Promise<Routine> => {
  const response = await api.get<Routine>(`/routines/${id}`);
  return keysToCamel(response.data);
};
export const createRoutine = async (
  routine: RoutineSchema,
): Promise<Routine> => {
  try {
    const response = await api.post<Routine>("/routines", keysToSnake(routine));

    return keysToCamel(response.data);
  } catch (err) {
    if (isValidationError(err)) {
      throw err;
    }

    throw err;
  }
};

export const editRoutine = async (
  routine: Partial<RoutineSchema>,
  routineId: number,
): Promise<Routine> => {
  try {
    const cleanedRoutine = {
      ...routine,
      day: routine.day?.toString(),
      routineItems: routine.routineItems?.map((item) => {
        const { exercise, targetDuration, ...pureItemFields } = item;
        return {
          ...pureItemFields,
          targetDuration: targetDuration ? targetDuration * 60 : undefined,
        };
      }),
    };

    const response = await api.patch<Routine>(
      `/routines/${routineId}`,
      keysToSnake(cleanedRoutine),
    );

    return keysToCamel(response.data);
  } catch (err) {
    if (isValidationError(err)) {
      throw err;
    }

    throw err;
  }
};

export const deleteRoutine = async (routineId: number) => {
  await api.delete(`/routines/${routineId}`);
};
