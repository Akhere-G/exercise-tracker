"use server";
import { ActionResponse, api } from "@/src/lib/axios";
import { WorkoutSchema } from "./schema";
import { keysToCamel, keysToSnake } from "@/src/lib/apiUtils";
import { Workout, WorkoutStats } from "./types";
import { isAxiosError } from "axios";

export const getWorkout = async (
  workoutId: number,
): Promise<ActionResponse<Workout>> => {
  try {
    const response = await api.get<Workout>(`/workouts/${workoutId}`);
    return { success: true, data: keysToCamel(response.data) };
  } catch (err) {
    if (isAxiosError(err)) {
      return {
        success: false,
        error: { general: err.response?.data.detail },
      };
    }
    return {
      success: false,
      error: { general: "An unexpected error occured" },
    };
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
    return { success: true, data: keysToCamel(response.data) };
  } catch (err) {
    if (isAxiosError(err)) {
      return {
        success: false,
        error: { general: err.response?.data.detail },
      };
    }
    return {
      success: false,
      error: { general: "An unexpected error occured" },
    };
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

    return { success: true, data: keysToCamel(response.data) };
  } catch (err) {
    if (isAxiosError(err)) {
      return {
        success: false,
        error: { general: err.response?.data.detail },
      };
    }
    return {
      success: false,
      error: { general: "An unexpected error occured" },
    };
  }
};

export const createWorkout = async (
  workout: WorkoutSchema,
): Promise<ActionResponse<Workout>> => {
  try {
    const formattedWorkout: WorkoutSchema = {
      ...workout,
      sets: workout.sets.map((s) => ({
        ...s,
        durationSecs: s.durationSecs ? s.durationSecs * 60 : null,
      })),
    };

    const repsonse = await api.post("/workouts", keysToSnake(formattedWorkout));
    return { success: true, data: keysToCamel(repsonse.data) };
  } catch (err) {
    if (isAxiosError(err)) {
      // const error = getValidationErrors(err.reponse?.data?.detail);
      return {
        success: false,
        error: { general: "An unknown error occured." },
      };
    }

    return { success: false, error: { general: "An unknown error occured." } };
  }
};
