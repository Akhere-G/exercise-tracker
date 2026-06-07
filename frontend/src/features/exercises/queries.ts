import { api } from "@/src/lib/axios";
import type { Exercise } from "./types";
import { ActionResponse } from "@/src/lib/apiTypes";
import { isAxiosError } from "axios";

export const getExerciseById = async (
  id: number,
): Promise<ActionResponse<Exercise>> => {
  try {
    const response = await api.get<Exercise>(`/exercises/${id}`);
    return { success: true, data: response.data };
  } catch (err) {
    if (isAxiosError(err)) {
      return { success: false, error: err.response?.data.detail };
    }
    return {
      success: false,
      error: "An unexpected error occured",
    };
  }
};
