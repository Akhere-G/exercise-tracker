import * as yup from "yup";
import { DEFAULT_STATS_RANGE, STATS_RANGES, StatsRange } from "./types";

export const statsRangeSchema = yup
  .string()
  .oneOf<StatsRange>(STATS_RANGES.map((r) => r.value))
  .default(DEFAULT_STATS_RANGE);
