import { api, handleApiError } from "@/src/lib/axios";
import type { Routine } from "./types";
import { ActionResponse } from "@/src/lib/apiTypes";

export const getAllRoutines = async (): Promise<ActionResponse<Routine[]>> => {
  try {
    const response = await api.get<Routine[]>("/routines");
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Routine[]>(err);
  }
};

export const getRoutineById = async (
  id: number,
): Promise<ActionResponse<Routine>> => {
  try {
    const response = await api.get<Routine>(`/routines/${id}`);
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Routine>(err);
  }
};
