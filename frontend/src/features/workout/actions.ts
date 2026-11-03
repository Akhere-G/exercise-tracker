"use server";
import { api, handleApiError } from "@/src/lib/axios";
import { WorkoutSchema } from "./schema";
import { ActionResponse } from "@/src/lib/apiTypes";
import { PreviousSet, Workout, WorkoutSet } from "./types";

export const createWorkout = async (
  workout: WorkoutSchema,
): Promise<ActionResponse<Workout>> => {
  try {
    const formattedWorkout: WorkoutSchema = {
      ...workout,
      sets: workout.sets.map((s) => ({
        ...s,
        durationSecs: s.durationSecs,
      })),
    };

    const response = await api.post<Workout>("/workouts", formattedWorkout);
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Workout>(err);
  }
};

export const updateWorkout = async (
  workoutId: number,
  workout: WorkoutSchema,
): Promise<ActionResponse<Workout>> => {
  try {
    const formattedWorkout: WorkoutSchema = {
      ...workout,
      duration: workout.duration * 60,
      sets: workout.sets.map((s) => ({
        ...s,
        durationSecs: s.durationSecs,
      })),
    };

    const response = await api.patch<Workout>(
      `/workouts/${workoutId}`,
      formattedWorkout,
    );
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Workout>(err);
  }
};

export const getWorkoutsInRange = async (
  start: string,
  end: string,
): Promise<ActionResponse<Workout[]>> => {
  try {
    const response = await api.get<Workout[]>("/workouts", {
      params: { start, end },
    });
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Workout[]>(err);
  }
};

export const getPreviousSetsForExercises = async (
  exerciseIds: number[],
): Promise<ActionResponse<Record<number, PreviousSet[]>>> => {
  if (exerciseIds.length === 0) return { success: true, data: {} };

  try {
    const response = await api.get<Record<number, PreviousSet[]>>(
      "/workouts/previous",
      { params: { exerciseIds: exerciseIds.join(",") } },
    );

    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Record<number, PreviousSet[]>>(err);
  }
};

export const deleteWorkout = async (
  workoutId: number,
): Promise<ActionResponse<number>> => {
  try {
    const response = await api.delete<number>(`/workouts/${workoutId}`);
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<number>(err);
  }
};
