"use client";
import { useState } from "react";
import { Target } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/src/components/ui/input";
import { updateProfile } from "@/src/features/profile/actions";
import { useProfile } from "@/src/features/profile/components/ProfileProvider";
import { ProfileUpdate } from "@/src/features/profile/types";
import { toDisplayWeight, toKg } from "@/src/lib/units";

export default function GoalsForm() {
  const profile = useProfile();
  const unit = profile.weightUnit;
  const [isSaving, setIsSaving] = useState(false);

  async function save(update: ProfileUpdate) {
    setIsSaving(true);
    const response = await updateProfile(update);
    setIsSaving(false);
    if (!response.success) {
      toast.error(response.error ?? "Could not save your goals.");
    }
  }

  const parse = (value: string) => (value === "" ? null : Number(value));

  return (
    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Target className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-bold">Goals</h3>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Workouts per week
        <Input
          type="number"
          min="1"
          max="14"
          disabled={isSaving}
          defaultValue={profile.workoutsPerWeekTarget ?? ""}
          onBlur={(e) => {
            const target = parse(e.target.value);
            if (target !== profile.workoutsPerWeekTarget) {
              save({ workoutsPerWeekTarget: target });
            }
          }}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Target body weight ({unit})
        <Input
          type="number"
          min="0"
          step="0.1"
          disabled={isSaving}
          defaultValue={
            profile.targetBodyWeightKg === null
              ? ""
              : toDisplayWeight(profile.targetBodyWeightKg, unit)
          }
          onBlur={(e) => {
            const value = parse(e.target.value);
            const targetKg = value === null ? null : toKg(value, unit);
            if (targetKg !== profile.targetBodyWeightKg) {
              save({ targetBodyWeightKg: targetKg });
            }
          }}
        />
      </label>
    </div>
  );
}
