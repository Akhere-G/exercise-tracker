"use server";
import { revalidatePath } from "next/cache";
import { api, handleApiError } from "@/src/lib/axios";
import { ActionResponse } from "@/src/lib/apiTypes";
import { ExerciseSetting, Profile, ProfileUpdate } from "./types";

export const updateProfile = async (
  update: ProfileUpdate,
): Promise<ActionResponse<Profile>> => {
  try {
    const response = await api.patch<Profile>("/profile", update);
    revalidatePath("/", "layout");
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Profile>(err);
  }
};

export const saveExerciseRestTime = async (
  exerciseId: number,
  restSecs: number | null,
): Promise<ActionResponse<ExerciseSetting>> => {
  try {
    const response = await api.put<ExerciseSetting>(
      `/exercises/${exerciseId}/settings`,
      { restSecs },
    );
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<ExerciseSetting>(err);
  }
};
