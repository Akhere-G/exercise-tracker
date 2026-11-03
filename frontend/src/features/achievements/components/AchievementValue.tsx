"use client";
import { useWeightUnit } from "@/src/features/profile/components/ProfileProvider";
import { formatValue } from "../format";
import { AchievementTypes } from "../types";

export default function AchievementValue({
  value,
  type,
}: {
  value: number;
  type: AchievementTypes;
}) {
  return <>{formatValue(value, type, useWeightUnit())}</>;
}
