import { api, handleApiError } from "@/src/lib/axios";
import { ActionResponse } from "@/src/lib/apiTypes";
import { Wrapped, WrappedPeriod } from "./types";

export const getWrapped = async (
  period: WrappedPeriod,
  year?: number,
  month?: number,
): Promise<ActionResponse<Wrapped>> => {
  try {
    const response = await api.get<Wrapped>("/wrapped", {
      params: { period, year, month },
    });
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Wrapped>(err);
  }
};
