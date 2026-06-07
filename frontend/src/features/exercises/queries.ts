import { api } from "@/src/lib/axios";
import type { Exercise } from "./types";
import { ActionResponse } from "@/src/lib/apiTypes";
import { isAxiosError } from "axios";
import { workoutSetWithDate } from "../workout/types";

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

export const getWorkoutsForExercise = async (
  exerciseId: number,
): Promise<ActionResponse<workoutSetWithDate[]>> => {
  try {
    const response = await api.get<workoutSetWithDate[]>(
      `/exercises/${exerciseId}/workouts`,
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
