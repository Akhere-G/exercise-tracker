import { api } from "@/src/lib/axios";
import type { Routine } from "./types";
import { ActionResponse } from "@/src/lib/apiTypes";
import { isAxiosError } from "axios";

export const getAllRoutines = async (): Promise<ActionResponse<Routine[]>> => {
  try {
    const response = await api.get<Routine[]>("/routines");
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

export const getRoutineById = async (
  id: number,
): Promise<ActionResponse<Routine>> => {
  try {
    const response = await api.get<Routine>(`/routines/${id}`);
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
