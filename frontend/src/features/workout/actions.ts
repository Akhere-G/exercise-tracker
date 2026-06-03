"use server";
import { api } from "@/src/lib/axios";
import { WorkoutSchema } from "./schema";
import { ActionResponse } from "@/src/lib/apiTypes";
import { Workout } from "./types";
import { isAxiosError } from "axios";

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
    if (isAxiosError(err)) {
      // const error = getValidationErrors(err.reponse?.data?.detail);
      return {
        success: false,
        error: "An unknown error occured.",
      };
    }

    return { success: false, error: "An unknown error occured." };
  }
};
