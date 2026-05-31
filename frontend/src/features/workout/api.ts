"use server";
import { ActionResponse, api } from "@/src/lib/axios";
import { WorkoutSchema } from "./schema";
import { keysToCamel, keysToSnake } from "@/src/lib/apiUtils";
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
