import { toDisplayWeight, WeightUnit } from "@/src/lib/units";
import { ExtendedBodyPart, Slug } from "react-muscle-highlighter";
import { getGreyShadeCSS, mapToTargetMuscle } from "../workout/utils";
import { statsRangeSchema } from "./schema";
import {
  DEFAULT_STATS_RANGE,
  Granularity,
  MuscleRecovery,
  MuscleVolume,
  RecoveryStatus,
  STATS_TABS,
  StatsTab,
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

export const formatDistance = (meters: number) =>
  `${(meters / 1000).toFixed(1)} km`;

export function formatDuration(totalSecs: number) {
  const totalMins = Math.round(totalSecs / 60);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export function formatSignedDuration(secs: number) {
  const sign = secs > 0 ? "+" : secs < 0 ? "-" : "";
  const mins = Math.round(Math.abs(secs) / 60);
  if (mins < 60) return `${sign}${mins}m`;
  const hours = Math.round((mins / 60) * 10) / 10;
  return `${sign}${hours}h`;
}

export function formatSignedCount(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
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

export function formatWeekLabel(isoDate: string, granularity: Granularity = "week") {
  const [, month, day] = isoDate.split("-").map(Number);
  return granularity === "month" ? MONTHS[month - 1] : `${day} ${MONTHS[month - 1]}`;
}

export const monthName = (month: number) => MONTHS[month - 1];

export function parseStatsTab(value: string | string[] | undefined): StatsTab {
  return STATS_TABS.find((t) => t.value === value)?.value ?? "overview";
}

export function parseGranularity(
  value: string | string[] | undefined,
): Granularity {
  return value === "month" ? "month" : "week";
}

export function parseExerciseIds(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 3);
}

export const titleCase = (value: string) =>
  value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/** Body-map slugs that make up each muscle group. */
const GROUP_SLUGS: Record<string, Slug[]> = {
  chest: ["chest"],
  back: ["upper-back", "lower-back", "trapezius"],
  shoulders: ["deltoids"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  forearms: ["forearm"],
  quads: ["quadriceps"],
  hamstrings: ["hamstring"],
  glutes: ["gluteal"],
  calves: ["calves"],
  core: ["abs", "obliques"],
};

const toBodyParts = (
  entries: { group: string; intensity: number; color: string }[],
): ExtendedBodyPart[] =>
  entries.flatMap(({ group, intensity, color }) =>
    (GROUP_SLUGS[group] ?? []).map((slug) => ({ slug, intensity, color })),
  );

/** Heat map of weighted sets per group; the busiest group is the darkest. */
export function getVolumeBodyData(volume: MuscleVolume): ExtendedBodyPart[] {
  const max = Math.max(0, ...volume.groups.map((g) => g.thisWeekSets));
  return toBodyParts(
    volume.groups
      .filter((g) => g.thisWeekSets > 0)
      .map((g) => {
        const intensity = Math.max(
          1,
          Math.ceil((g.thisWeekSets / max) * MAX_BODY_INTENSITY),
        );
        return {
          group: g.group,
          intensity,
          color: getGreyShadeCSS(intensity),
        };
      }),
  );
}

export const RECOVERY_COLORS: Record<RecoveryStatus, string> = {
  fresh: "#10b981",
  recovering: "#f59e0b",
  fatigued: "#ef4444",
};

export function getRecoveryBodyData(recovery: MuscleRecovery[]): ExtendedBodyPart[] {
  return toBodyParts(
    recovery.map((r) => ({
      group: r.group,
      intensity: 1,
      color: RECOVERY_COLORS[r.status],
    })),
  );
}

/** Evidence-based weekly hard set range for growth, per muscle group. */
export const RECOMMENDED_WEEKLY_SETS = { min: 10, max: 20 };

export function getTrendData(
  trends: WeeklyTrend[],
  metric: TrendMetric,
  weightUnit: WeightUnit = "kg",
  granularity: Granularity = "week",
) {
  return trends.map((week) => ({
    x: formatWeekLabel(week.weekStart, granularity),
    y:
      metric === "workouts"
        ? week.workoutCount
        : metric === "volume"
          ? Math.round(toDisplayWeight(week.totalVolume, weightUnit))
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
