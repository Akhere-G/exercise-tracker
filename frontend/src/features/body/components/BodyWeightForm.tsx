"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { track } from "@/src/features/analytics/utils";
import { useWeightUnit } from "@/src/features/profile/components/ProfileProvider";
import { toKg } from "@/src/lib/units";
import { saveBodyWeight } from "../actions";
import { bodyWeightSchema } from "../schema";

const today = () => new Date().toLocaleDateString("en-CA");

export default function BodyWeightForm() {
  const unit = useWeightUnit();
  const [measuredOn, setMeasuredOn] = useState(today);
  const [weight, setWeight] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    let values;
    try {
      values = bodyWeightSchema.validateSync({
        measuredOn,
        weight: weight === "" ? undefined : Number(weight),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check your entry");
      return;
    }

    setIsSaving(true);
    const response = await saveBodyWeight(
      values.measuredOn,
      toKg(values.weight, unit),
    );
    setIsSaving(false);

    if (response.success) {
      track("save_body_weight");
      setWeight("");
      toast.success("Weight saved");
    } else {
      toast.error(response.error);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Date
        <Input
          type="date"
          value={measuredOn}
          max={today()}
          onChange={(e) => setMeasuredOn(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Weight ({unit})
        <Input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
      </label>
      <Button type="submit" disabled={isSaving}>
        Save
      </Button>
    </form>
  );
}
