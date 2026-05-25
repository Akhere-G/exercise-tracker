import * as Yup from "yup";

export const workoutSetSchema = Yup.object()
  .shape({
    exerciseId: Yup.number().required(),
    setIndex: Yup.number().default(1),
    reps: Yup.number().nullable(),
    weight: Yup.number().nullable(),
    durationSecs: Yup.number().nullable(),
  })
  .test(
    "validate-set-data",
    "You must provide either 'reps' or 'weight' or 'duration' for this set.",
    function (values) {
      const { reps, weight, durationSecs } = values;

      const hasReps = !!reps && reps > 0;
      const hasWeight = !!weight && weight > 0;
      const hasDuration = !!durationSecs && durationSecs > 0;

      return hasReps || hasWeight || hasDuration;
    },
  );

export const workoutSchema = Yup.object().shape({
  routineId: Yup.number().required(),
  completedAt: Yup.date().required(),
  duration: Yup.number().required().min(0, "Duration cannot be negative"),
  sets: Yup.array()
    .of(workoutSetSchema)
    .min(1, "A workout must contain at least one set.")
    .required("Sets are required"),
});

export type WorkoutSetSchema = Yup.InferType<typeof workoutSetSchema>;
export type WorkoutSchema = Yup.InferType<typeof workoutSchema>;
