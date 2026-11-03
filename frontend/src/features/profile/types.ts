import { WeightUnit } from "@/src/lib/units";

export type EffortMetric = "off" | "rpe" | "rir";
export type CoachPersona = "hype" | "drill" | "physio" | "nerd" | "oldschool";

export interface Profile {
  weightUnit: WeightUnit;
  effortMetric: EffortMetric;
  sex: "male" | "female" | "unspecified" | null;
  experience: "beginner" | "intermediate" | "advanced" | null;
  goal: "strength" | "hypertrophy" | "fat_loss" | "general" | "endurance" | null;
  workoutsPerWeekTarget: number | null;
  targetBodyWeightKg: number | null;
  targetLiftExerciseId: number | null;
  targetLiftKg: number | null;
  coachPersona: CoachPersona;
  wrappedTheme: "football" | "f1" | "boxing" | "basketball" | "athletics" | null;
  timezone: string | null;
  onboardedAt: string | null;
}

export type ProfileUpdate = Partial<Profile>;

export interface ExerciseSetting {
  exerciseId: number;
  restSecs: number | null;
}

export const DEFAULT_PROFILE: Profile = {
  weightUnit: "kg",
  effortMetric: "off",
  sex: null,
  experience: null,
  goal: null,
  workoutsPerWeekTarget: null,
  targetBodyWeightKg: null,
  targetLiftExerciseId: null,
  targetLiftKg: null,
  coachPersona: "hype",
  wrappedTheme: null,
  timezone: null,
  onboardedAt: null,
};
