"use client";

import { useWeightUnit } from "@/src/features/profile/components/ProfileProvider";
import { formatTarget, TargetSummary } from "../utils";

/** A target in the user's weight unit, e.g. `3 x 10 @ 40 kg` or `2 km in 12:00`. */
export function TargetText({ target }: { target: TargetSummary }) {
  return <>{formatTarget(target, useWeightUnit())}</>;
}
