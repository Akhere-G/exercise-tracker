import { api, handleApiError } from "@/src/lib/axios";
import { ActionResponse } from "@/src/lib/apiTypes";
import { Workout, WorkoutStats } from "./types";

export const getWorkout = async (
  workoutId: number,
): Promise<ActionResponse<Workout>> => {
  try {
    const response = await api.get<Workout>(`/workouts/${workoutId}`);
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Workout>(err);
  }
};

export const getWorkouts = async (
  routineId?: number,
): Promise<ActionResponse<Workout[]>> => {
  try {
    let url = "/workouts";
    if (routineId) {
      url += `?routineId=${routineId}`;
    }

    const response = await api.get<Workout[]>(url);
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Workout[]>(err);
  }
};

export const getWorkoutStats = async (
  routineId?: number,
): Promise<ActionResponse<WorkoutStats>> => {
  try {
    let url = "/workouts/stats";
    if (routineId) {
      url += `?routineId=${routineId}`;
    }
    const response = await api.get<WorkoutStats>(url);

    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<WorkoutStats>(err);
  }
};
