import { formatWeight, WeightUnit } from "@/src/lib/units";
import { achievementFreqTypes, achievementTypes, AchievementTypes } from "./types";

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatValue(
  value: number,
  type: AchievementTypes,
  unit: WeightUnit = "kg",
) {
  if (type in achievementFreqTypes) {
    return `${value} ${value === 1 ? "week" : "weeks"}`;
  }

  switch (type) {
    case achievementTypes.pr_weight:
      return formatWeight(value, unit);
    case achievementTypes.pr_reps:
      return `${value} ${value === 1 ? "rep" : "reps"}`;
    case achievementTypes.pr_distance:
      return `${formatNumber(value / 1000)} km`;
    case achievementTypes.pr_duration:
      return `${formatNumber(value / 60)} mins`;
    default:
      return String(value);
  }
}
