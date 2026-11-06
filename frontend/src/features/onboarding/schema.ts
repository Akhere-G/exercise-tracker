import * as Yup from "yup";

export const onboardingSchema = Yup.object().shape({
  goal: Yup.string()
    .oneOf(["strength", "hypertrophy", "fat_loss", "general", "endurance"])
    .required(),
  experience: Yup.string()
    .oneOf(["beginner", "intermediate", "advanced"])
    .required(),
  workoutsPerWeek: Yup.number().integer().min(1).max(14).required(),
  weightUnit: Yup.string().oneOf(["kg", "lb"]).required(),
  sex: Yup.string().oneOf(["male", "female", "unspecified"]).required(),
  bodyWeightKg: Yup.number().positive().max(500).nullable().defined(),
  coachPersona: Yup.string()
    .oneOf(["hype", "drill", "physio", "nerd", "oldschool"])
    .required(),
  timezone: Yup.string().required(),
});

export type OnboardingValues = Yup.InferType<typeof onboardingSchema>;
