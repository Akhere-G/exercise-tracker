import * as yup from "yup";

export const EQUIPMENT_OPTIONS = [
  { value: "bodyweight", label: "Bodyweight" },
  { value: "dumbbells", label: "Dumbbells" },
  { value: "barbell", label: "Barbell" },
  { value: "cables", label: "Cables" },
  { value: "machines", label: "Machines" },
  { value: "kettlebell", label: "Kettlebell" },
  { value: "bands", label: "Bands" },
] as const;

export const GOAL_OPTIONS = [
  { value: "strength", label: "Strength" },
  { value: "hypertrophy", label: "Muscle growth" },
  { value: "fat_loss", label: "Fat loss" },
  { value: "general", label: "General fitness" },
  { value: "endurance", label: "Endurance" },
] as const;

const goals = GOAL_OPTIONS.map((o) => o.value);
const equipment = EQUIPMENT_OPTIONS.map((o) => o.value);

export const buildRoutineSchema = yup.object({
  goal: yup.string().oneOf(goals).required("Choose a goal"),
  equipment: yup
    .array(yup.string().oneOf(equipment).required())
    .min(1, "Choose at least one kind of equipment")
    .required(),
  minutes: yup
    .number()
    .typeError("Enter how long you have")
    .min(15, "At least 15 minutes")
    .max(180, "At most 180 minutes")
    .required(),
  daysPerWeek: yup
    .number()
    .typeError("Enter how many days")
    .integer()
    .min(1, "At least 1 day")
    .max(7, "At most 7 days")
    .required(),
  focus: yup.string().max(100).notRequired(),
  notes: yup.string().max(500).notRequired(),
});

export type BuildRoutineSchema = yup.InferType<typeof buildRoutineSchema>;
