import { Profile } from "@/src/features/profile/types";

export interface Option<T extends string | number> {
  value: T;
  label: string;
  description?: string;
}

export const GOALS: Option<NonNullable<Profile["goal"]>>[] = [
  { value: "strength", label: "Get stronger", description: "Lift heavier" },
  { value: "hypertrophy", label: "Build muscle", description: "Add size" },
  { value: "fat_loss", label: "Lose fat", description: "Lean out" },
  { value: "endurance", label: "Build endurance", description: "Go longer" },
  { value: "general", label: "Stay fit", description: "General health" },
];

export const EXPERIENCE: Option<NonNullable<Profile["experience"]>>[] = [
  { value: "beginner", label: "Beginner", description: "Under a year" },
  { value: "intermediate", label: "Intermediate", description: "1 to 3 years" },
  { value: "advanced", label: "Advanced", description: "3+ years" },
];

export const FREQUENCIES: Option<number>[] = [2, 3, 4, 5, 6].map((days) => ({
  value: days,
  label: `${days} days`,
  description: "per week",
}));

export const SEXES: Option<NonNullable<Profile["sex"]>>[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "unspecified", label: "Prefer not to say" },
];
