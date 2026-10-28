import { ExtendedBodyPart, Slug } from "react-muscle-highlighter";
import { getGreyShadeCSS, mapToTargetMuscle } from "../workout/utils";
import { statsRangeSchema } from "./schema";
import {
  DEFAULT_STATS_RANGE,
  MuscleStat,
  STATS_RANGES,
  StatsRange,
  TrendMetric,
  WeeklyTrend,
} from "./types";

const MAX_BODY_INTENSITY = 12;

export function parseStatsRange(
  value: string | string[] | undefined,
): StatsRange {
  return statsRangeSchema.isValidSync(value) && typeof value === "string"
    ? (value as StatsRange)
    : DEFAULT_STATS_RANGE;
}

const toIsoDate = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

export function getRangeDates(
  range: StatsRange,
  today: Date = new Date(),
): { start?: string; end?: string } {
  const { days } = STATS_RANGES.find((r) => r.value === range)!;
  if (days === null) return {};

  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  return { start: toIsoDate(start), end: toIsoDate(today) };
}

export const formatNumber = (value: number) =>
  Math.round(value).toLocaleString("en-US");

export const formatVolume = (kg: number) => `${formatNumber(kg)} kg`;

export const formatDistance = (meters: number) =>
  `${(meters / 1000).toFixed(1)} km`;

export function formatDuration(totalSecs: number) {
  const totalMins = Math.round(totalSecs / 60);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatWeekLabel(isoDate: string) {
  const [, month, day] = isoDate.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]}`;
}

export function getTrendData(trends: WeeklyTrend[], metric: TrendMetric) {
  return trends.map((week) => ({
    x: formatWeekLabel(week.weekStart),
    y:
      metric === "workouts"
        ? week.workoutCount
        : metric === "volume"
          ? Math.round(week.totalVolume)
          : Math.round(week.totalDurationSecs / 60),
  }));
}

export function getMuscleChartData(muscles: MuscleStat[]) {
  const setsBySlug: Record<string, number> = {};

  muscles.forEach((muscle) => {
    const slug = mapToTargetMuscle(muscle.name);
    if (slug) {
      setsBySlug[slug] =
        (setsBySlug[slug] ?? 0) + muscle.primarySets + muscle.secondarySets;
    }
  });

  const maxSets = Math.max(0, ...Object.values(setsBySlug));

  const data: ExtendedBodyPart[] = Object.entries(setsBySlug).map(
    ([slug, sets]) => {
      const intensity = Math.max(
        1,
        Math.ceil((sets / maxSets) * MAX_BODY_INTENSITY),
      );
      return {
        slug: slug as Slug,
        intensity,
        color: getGreyShadeCSS(intensity),
      };
    },
  );

  return data;
}
