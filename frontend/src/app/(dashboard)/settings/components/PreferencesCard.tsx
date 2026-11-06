"use client";
import { useState } from "react";
import { Scale } from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "@/src/features/profile/actions";
import { useProfile } from "@/src/features/profile/components/ProfileProvider";
import { Persona } from "@/src/features/ai/types";
import {
  CoachPersona,
  EffortMetric,
  ProfileUpdate,
} from "@/src/features/profile/types";
import { WeightUnit } from "@/src/lib/units";

const UNITS: { value: WeightUnit; label: string }[] = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "lb", label: "Pounds (lb)" },
];

const EFFORT_METRICS: { value: EffortMetric; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "rpe", label: "RPE (rate of perceived exertion)" },
  { value: "rir", label: "RIR (reps in reserve)" },
];

export default function PreferencesCard({
  personas = [],
}: {
  personas?: Persona[];
}) {
  const profile = useProfile();
  const [isSaving, setIsSaving] = useState(false);

  async function save(update: ProfileUpdate) {
    setIsSaving(true);
    const response = await updateProfile(update);
    setIsSaving(false);

    if (!response.success) {
      toast.error(response.error ?? "Could not save your preferences.");
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden flex flex-col gap-4 min-h-[180px]">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Scale className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-bold">Training preferences</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Weights are stored in kilograms and converted for display, so you can
        switch units at any time without losing accuracy.
      </p>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Weight unit
        <select
          value={profile.weightUnit}
          disabled={isSaving}
          onChange={(e) => save({ weightUnit: e.target.value as WeightUnit })}
        >
          {UNITS.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Track effort per set
        <select
          value={profile.effortMetric}
          disabled={isSaving}
          onChange={(e) =>
            save({ effortMetric: e.target.value as EffortMetric })
          }
        >
          {EFFORT_METRICS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      {personas.length > 0 && (
        <label className="flex flex-col gap-1 text-sm font-medium">
          Coach
          <select
            value={profile.coachPersona}
            disabled={isSaving}
            onChange={(e) =>
              save({ coachPersona: e.target.value as CoachPersona })
            }
          >
            {personas.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name} – {p.tagline}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
