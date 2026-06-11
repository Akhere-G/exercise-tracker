import { api, handleApiError } from "@/src/lib/axios";
import type { Exercise } from "./types";
import { ActionResponse } from "@/src/lib/apiTypes";
import { workoutSetWithDate } from "../workout/types";

export const getExerciseById = async (
  id: number,
): Promise<ActionResponse<Exercise>> => {
  try {
    const response = await api.get<Exercise>(`/exercises/${id}`);
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Exercise>(err);
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
    return handleApiError<workoutSetWithDate[]>(err);
  }
};
