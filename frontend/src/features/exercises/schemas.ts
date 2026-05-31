import * as yup from "yup";

export const MetricsType = {
  REPS: "reps",
  REPS_WEIGHT: "reps+weight",
  DURATION: "duration",
} as const;

export type Metrics = (typeof MetricsType)[keyof typeof MetricsType];

export const metrics = yup.string<Metrics>().oneOf(Object.values(MetricsType));

export const exerciseSchema = yup.object({
  id: yup.number(),
  name: yup.string(),
  instructions: yup.string(),
  videoUrl: yup.string(),
  imageUrl: yup.string(),
  metrics,
  equipment: yup.string(),
  muscles: yup.array(
    yup.object({
      name: yup.string(),
      contributionType: yup.string(),
    }),
  ),
});

export type ExerciseSchema = yup.InferType<typeof exerciseSchema>;
