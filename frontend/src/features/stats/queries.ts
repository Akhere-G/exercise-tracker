import { api, handleApiError } from "@/src/lib/axios";
import { ActionResponse } from "@/src/lib/apiTypes";
import {
  Consistency,
  ExerciseSeries,
  Granularity,
  MuscleRecovery,
  MuscleVolume,
  PeriodComparison,
  Stats,
  StatsRange,
  StrengthStandards,
} from "./types";
import { getRangeDates } from "./utils";

export const getStats = async (
  range: StatsRange,
  granularity: Granularity = "week",
): Promise<ActionResponse<Stats>> => {
  try {
    const response = await api.get<Stats>("/stats", {
      params: { ...getRangeDates(range), granularity },
    });
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<Stats>(err);
  }
};

async function get<T>(
  url: string,
  params?: Record<string, string | number | undefined>,
): Promise<ActionResponse<T>> {
  try {
    const response = await api.get<T>(url, { params });
    return { success: true, data: response.data };
  } catch (err) {
    return handleApiError<T>(err);
  }
}

export const getMuscleVolume = (weeks = 8) =>
  get<MuscleVolume>("/stats/muscle-volume", { weeks });

export const getRecovery = () => get<MuscleRecovery[]>("/stats/recovery");

export const getStrengthStandards = () =>
  get<StrengthStandards>("/stats/strength-standards");

export const getConsistency = (year?: number) =>
  get<Consistency>("/stats/consistency", { year });

export const getPeriodComparison = (range: StatsRange) => {
  const { start, end } = getRangeDates(range);
  return start && end
    ? get<PeriodComparison>("/stats/compare/periods", { start, end })
    : Promise.resolve(null);
};

export const getExerciseComparison = (ids: number[], range: StatsRange) =>
  get<ExerciseSeries[]>("/stats/compare/exercises", {
    ids: ids.join(","),
    ...getRangeDates(range),
  });
