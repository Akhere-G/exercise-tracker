import { cache } from "react";
import { api, handleApiError } from "@/src/lib/axios";
import { ActionResponse } from "@/src/lib/apiTypes";
import { DEFAULT_PROFILE, ExerciseSetting, Profile } from "./types";

export const getProfileResponse = cache(
  async (): Promise<ActionResponse<Profile>> => {
    try {
      const response = await api.get<Profile>("/profile");
      return { success: true, data: response.data };
    } catch (err) {
      return handleApiError<Profile>(err);
    }
  },
);

/** The profile, or the defaults when it could not be loaded. */
export const getProfile = async (): Promise<Profile> => {
  const response = await getProfileResponse();
  return response.success ? response.data : DEFAULT_PROFILE;
};

export const getWeightUnit = async () => (await getProfile()).weightUnit;

export const getExerciseSettings = async (): Promise<
  ActionResponse<ExerciseSetting[]>
> => {
  try {
    const response = await api.get<ExerciseSetting[]>("/exercises/settings");
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<ExerciseSetting[]>(err);
  }
};
