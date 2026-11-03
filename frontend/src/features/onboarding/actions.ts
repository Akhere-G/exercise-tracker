"use server";
import { ActionResponse } from "@/src/lib/apiTypes";
import { saveBodyWeight } from "@/src/features/body/actions";
import { updateProfile } from "@/src/features/profile/actions";
import { Profile } from "@/src/features/profile/types";
import { OnboardingValues } from "./schema";

const markOnboarded = () => ({ onboardedAt: new Date().toISOString() });

export const completeOnboarding = async (
  values: OnboardingValues,
): Promise<ActionResponse<Profile>> => {
  if (values.bodyWeightKg) {
    const saved = await saveBodyWeight(
      new Date().toLocaleDateString("en-CA"),
      values.bodyWeightKg,
    );
    if (!saved.success) return { success: false, error: saved.error };
  }

  return updateProfile({
    goal: values.goal,
    experience: values.experience,
    workoutsPerWeekTarget: values.workoutsPerWeek,
    weightUnit: values.weightUnit,
    sex: values.sex,
    coachPersona: values.coachPersona,
    timezone: values.timezone,
    ...markOnboarded(),
  });
};

export const skipOnboarding = async (): Promise<ActionResponse<Profile>> =>
  updateProfile(markOnboarded());
