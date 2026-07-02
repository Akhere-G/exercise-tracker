"use server";
import { api, handleApiError } from "@/src/lib/axios";
import { WorkoutSchema } from "./schema";
import { ActionResponse } from "@/src/lib/apiTypes";
import { Workout, WorkoutSet } from "./types";

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

    const repsonse = await api.post<Workout>("/workouts", formattedWorkout);
    return { success: true, data: repsonse.data };
  } catch (err) {
    return handleApiError<Workout>(err);
  }
};

export const getPreviousSets = async (
  exerciseId: number,
): Promise<ActionResponse<WorkoutSet[]>> => {
  try {
    const response = await api.get<WorkoutSet[]>(
      `/workouts/previous/${exerciseId}`,
    );

    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<WorkoutSet[]>(err);
  }
};
