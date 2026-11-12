import { describe, expect, it } from "vitest";
import {
  formatDistance,
  formatDuration,
  formatSignedCount,
  formatSignedDuration,
  formatWeekLabel,
  getMuscleChartData,
  getRangeDates,
  getRecoveryBodyData,
  getTrendData,
  getVolumeBodyData,
  parseExerciseIds,
  parseGranularity,
  parseStatsRange,
  parseStatsTab,
  RECOVERY_COLORS,
} from "./utils";
import { MuscleVolume } from "./types";

describe("URL parameter parsing", () => {
  it("falls back to defaults for missing, invalid or repeated params", () => {
    expect(parseStatsRange("90d")).toBe("90d");
    expect(parseStatsRange("all")).toBe("all");
    expect(parseStatsRange("365d")).toBe("30d");
    expect(parseStatsRange(["7d", "90d"])).toBe("30d");
    expect(parseStatsRange(undefined)).toBe("30d");

    expect(parseStatsTab("strength")).toBe("strength");
    expect(parseStatsTab("bogus")).toBe("overview");

    expect(parseGranularity("month")).toBe("month");
    expect(parseGranularity("year")).toBe("week");
  });

  it("keeps up to three positive integer exercise ids", () => {
    expect(parseExerciseIds("3,abc,-1,0,4.5,7,9,11")).toEqual([3, 7, 9]);
    expect(parseExerciseIds(["5,6", "7"])).toEqual([5, 6]);
    expect(parseExerciseIds(undefined)).toEqual([]);
  });
});

describe("getRangeDates", () => {
  const today = new Date(2026, 2, 3); // 3 March 2026, local time

  it("covers the last N days including today, across a month boundary", () => {
    expect(getRangeDates("7d", today)).toEqual({
      start: "2026-02-25",
      end: "2026-03-03",
    });
  });

  it("has no bounds for all time", () => {
    expect(getRangeDates("all", today)).toEqual({});
  });
});

describe("formatters", () => {
  it("formats durations, distances and signed deltas", () => {
    expect(formatDuration(45 * 60)).toBe("45m");
    expect(formatDuration(65 * 60)).toBe("1h 5m");
    expect(formatDuration(0)).toBe("0m");
    expect(formatDistance(1234)).toBe("1.2 km");
    expect(formatSignedDuration(30 * 60)).toBe("+30m");
    expect(formatSignedDuration(-90 * 60)).toBe("-1.5h");
    expect(formatSignedDuration(0)).toBe("0m");
    expect(formatSignedCount(3)).toBe("+3");
    expect(formatSignedCount(-2)).toBe("-2");
    expect(formatSignedCount(0)).toBe("0");
  });

  it("labels trend buckets by week or month", () => {
    expect(formatWeekLabel("2026-11-02")).toBe("2 Nov");
    expect(formatWeekLabel("2026-11-01", "month")).toBe("Nov");
  });
});

describe("chart data", () => {
  it("converts trend volume to the user's unit and duration to minutes", () => {
    const trends = [
      {
        weekStart: "2026-11-02",
        workoutCount: 3,
        totalVolume: 1000,
        totalDurationSecs: 5430,
      },
    ];
    expect(getTrendData(trends, "workouts")).toEqual([{ x: "2 Nov", y: 3 }]);
    expect(getTrendData(trends, "volume", "lb")).toEqual([
      { x: "2 Nov", y: 2205 },
    ]);
    expect(getTrendData(trends, "minutes")).toEqual([{ x: "2 Nov", y: 91 }]);
  });

  it("scales muscle sets so the busiest muscle is darkest", () => {
    const data = getMuscleChartData([
      { name: "Chest", primarySets: 10, secondarySets: 2 },
      { name: "Triceps", primarySets: 0, secondarySets: 3 },
      { name: "Not a muscle", primarySets: 5, secondarySets: 0 },
    ]);
    expect(data).toEqual([
      expect.objectContaining({ slug: "chest", intensity: 12 }),
      expect.objectContaining({ slug: "triceps", intensity: 3 }),
    ]);
  });

  it("leaves untrained muscles off instead of producing NaN", () => {
    const data = getMuscleChartData([
      { name: "Chest", primarySets: 0, secondarySets: 0 },
    ]);
    expect(data).toEqual([]);
  });

  it("maps volume groups onto every body slug they cover, skipping idle groups", () => {
    const volume = {
      groups: [
        { group: "back", sets: [], volume: [], thisWeekSets: 10 },
        { group: "chest", sets: [], volume: [], thisWeekSets: 5 },
        { group: "calves", sets: [], volume: [], thisWeekSets: 0 },
      ],
    } as unknown as MuscleVolume;

    const data = getVolumeBodyData(volume);
    expect(data.map((d) => [d.slug, d.intensity])).toEqual([
      ["upper-back", 12],
      ["lower-back", 12],
      ["trapezius", 12],
      ["chest", 6],
    ]);
  });

  it("colours recovery by status", () => {
    const [shoulder] = getRecoveryBodyData([
      {
        group: "shoulders",
        fatigue: 0.9,
        status: "fatigued",
        hoursSinceTrained: 10,
      },
    ]);
    expect(shoulder).toEqual({
      slug: "deltoids",
      intensity: 1,
      color: RECOVERY_COLORS.fatigued,
    });
  });
});
