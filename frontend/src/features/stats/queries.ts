import { api, handleApiError } from "@/src/lib/axios";
import { ActionResponse } from "@/src/lib/apiTypes";
import { Stats, StatsRange } from "./types";
import { getRangeDates } from "./utils";

export const getStats = async (
  range: StatsRange,
): Promise<ActionResponse<Stats>> => {
  try {
    const response = await api.get<Stats>("/stats", {
      params: getRangeDates(range),
    });
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Stats>(err);
  }
};
