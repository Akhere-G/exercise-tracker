import { ExtendedBodyPart, Slug } from "react-muscle-highlighter";
import { getGreyShadeCSS, mapToTargetMuscle } from "../workout/utils";
import { Metrics, MetricsType } from "./schemas";
import { Exercise } from "./types";

export const isRepsExercise = (exercise: Exercise) =>
  ([MetricsType.REPS, MetricsType.REPS_WEIGHT] as Metrics[]).includes(
    exercise.metrics,
  );

export const isWeightsExercise = (exercise: Exercise) =>
  MetricsType.REPS_WEIGHT === exercise.metrics;

export const isDurationExercise = (exercise: Exercise) =>
  ([MetricsType.DURATION, MetricsType.DURATION_DISTANCE] as Metrics[]).includes(
    exercise.metrics,
  );

export const isCardioExercise = (exercise: Exercise) =>
  MetricsType.DURATION_DISTANCE === exercise.metrics;

export const getMuscleMapData = (exercises: Exercise[]) => {
  const muscles: Record<string, number> = {};

  exercises.forEach((e) =>
    e.muscles.forEach((m) => {
      const contribution = m.contributionType === "primary" ? 5 : 4;
      const name = mapToTargetMuscle(m.name);
      if (name) {
        muscles[name] = (muscles[name] ?? 0) + contribution;
      }
    }),
  );

  const data: ExtendedBodyPart[] = Object.entries(muscles).map(
    ([slug, intensity]) => ({
      slug: slug.toLowerCase() as Slug,
      intensity,
      color: getGreyShadeCSS(intensity),
    }),
  );

  return data;
};

/** Epley's estimate of a one-rep max from a single set. */
const epley = (weight: number, reps: number) => weight * (1 + reps / 30);

/**
 * The best estimated one-rep max across the given sets (Epley), ignoring
 * warm-ups. Returns 0 when there are no weighted working sets.
 */
export const getEstimatedOneRepMax = (
  sets: { weight?: number | null; reps?: number | null; setType?: string }[],
) => {
  let best = 0;
  for (const set of sets) {
    if (set.setType === "warmup") continue;
    best = Math.max(best, epley(set.weight || 0, set.reps || 0));
  }
  return best;
};

export const getImageUrl = (exerciseImage: string) =>
  `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/refs/heads/main/${exerciseImage}`;
