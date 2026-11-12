"use client";
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
  // Each field saves on its own, so fields stay editable while another saves:
  // disabling them blurred the field being typed into and lost the input.
  async function save(update: ProfileUpdate) {
    const response = await updateProfile(update);
    if (!response.success) {
      toast.error(response.error ?? "Could not save your goals.");
    }
  }

  const parse = (value: string) => (value === "" ? null : Number(value));
  // Compared in the user's unit: converting the rounded display value back to
  // kg would differ slightly from the stored value and save a drifted goal.
  const displayedBodyWeight =
    profile.targetBodyWeightKg === null
      ? null
      : toDisplayWeight(profile.targetBodyWeightKg, unit);

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
          defaultValue={displayedBodyWeight ?? ""}
          onBlur={(e) => {
            const value = parse(e.target.value);
            if (value !== displayedBodyWeight) {
              save({
                targetBodyWeightKg: value === null ? null : toKg(value, unit),
              });
            }
          }}
        />
      </label>
    </div>
  );
}
