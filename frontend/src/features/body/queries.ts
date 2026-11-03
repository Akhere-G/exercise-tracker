import { api, handleApiError } from "@/src/lib/axios";
import { ActionResponse } from "@/src/lib/apiTypes";
import { BodyWeight } from "./types";

export const getBodyWeights = async (): Promise<
  ActionResponse<BodyWeight[]>
> => {
  try {
    const response = await api.get<BodyWeight[]>("/body/weights");
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<BodyWeight[]>(err);
  }
};
