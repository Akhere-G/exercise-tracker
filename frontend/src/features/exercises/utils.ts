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
