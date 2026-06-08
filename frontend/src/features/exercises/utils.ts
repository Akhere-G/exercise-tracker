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
  MetricsType.DURATION === exercise.metrics;

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

export const getImageUrl = (exerciseImage: string) =>
  `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/refs/heads/main/${exerciseImage}`;
