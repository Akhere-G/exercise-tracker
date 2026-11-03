import { api, handleApiError } from "@/src/lib/axios";
import { ActionResponse } from "@/src/lib/apiTypes";
import { Program } from "./types";

export const getPrograms = async (): Promise<ActionResponse<Program[]>> => {
  try {
    const response = await api.get<Program[]>("/programs");
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Program[]>(err);
  }
};
