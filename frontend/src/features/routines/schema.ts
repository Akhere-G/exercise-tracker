import * as yup from "yup";
import { exerciseSchema } from "../exercises/schemas";

export const routineItemSchema = yup.object({
  exercise: exerciseSchema.notRequired(),
  exerciseId: yup.number().required(),
  targetSets: yup.number().required().min(1, "Must be at least 1 set"),
  targetReps: yup
    .number()
    .notRequired()
    .test("reps-or-duration", "Must have reps or duration", function (value) {
      return (
        (value && value > 0) ||
        (this.parent.targetDuration && this.parent.targetDuration > 0)
      );
    }),
  targetDuration: yup
    .number()
    .notRequired()
    .test("reps-or-duration", "Must have reps or duration", function (value) {
      return (
        (value && value > 0) ||
        (this.parent.targetSets && this.parent.targetSets > 0)
      );
    }),
  order: yup.number().required(),
});

export const routineSchema = yup.object({
  name: yup.string().required(),
  day: yup.number().required().default(0),
  startTime: yup
    .string()
    .required()
    .test("is-time", "Invalid format", function (value) {
      return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
    }),
  routineItems: yup
    .array(routineItemSchema)
    .min(1, "You must add at least one exercise to your routine")
    .required("You must add at least one exercise to your routine"),
});

export type RoutineSchema = yup.InferType<typeof routineSchema>;
export type RoutineItemSchema = yup.InferType<typeof routineItemSchema>;
