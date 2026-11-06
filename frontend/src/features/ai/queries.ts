import { api, handleApiError } from "@/src/lib/axios";
import { ActionResponse } from "@/src/lib/apiTypes";
import { Persona } from "./types";

export const getPersonas = async (): Promise<ActionResponse<Persona[]>> => {
  try {
    const response = await api.get<Persona[]>("/ai/personas");
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Persona[]>(err);
  }
};
