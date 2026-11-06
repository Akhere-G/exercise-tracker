import { api, handleApiError } from "@/src/lib/axios";
import { ActionResponse } from "@/src/lib/apiTypes";
import { Goals } from "./types";

export const getGoals = async (): Promise<ActionResponse<Goals>> => {
  try {
    const response = await api.get<Goals>("/profile/goals");
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Goals>(err);
  }
};
