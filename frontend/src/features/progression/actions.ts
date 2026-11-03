"use server";
import { api, handleApiError } from "@/src/lib/axios";
import { ActionResponse } from "@/src/lib/apiTypes";
import { ProgressionSuggestion } from "./types";

export const getProgressionSuggestions = async (
  exerciseIds: number[],
): Promise<ActionResponse<ProgressionSuggestion[]>> => {
  if (exerciseIds.length === 0) return { success: true, data: [] };

  try {
    const response = await api.get<ProgressionSuggestion[]>("/progression", {
      params: { exerciseIds: exerciseIds.join(",") },
    });
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<ProgressionSuggestion[]>(err);
  }
};
