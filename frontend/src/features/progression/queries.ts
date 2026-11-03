import { api, handleApiError } from "@/src/lib/axios";
import { ActionResponse } from "@/src/lib/apiTypes";
import { DeloadAssessment } from "./types";

export const getDeloadAssessment = async (): Promise<
  ActionResponse<DeloadAssessment>
> => {
  try {
    const response = await api.get<DeloadAssessment>("/progression/deload");
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<DeloadAssessment>(err);
  }
};
