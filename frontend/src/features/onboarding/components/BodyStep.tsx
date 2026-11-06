import { Input } from "@/src/components/ui/input";
import { WeightUnit } from "@/src/lib/units";
import { Profile } from "@/src/features/profile/types";
import { SEXES } from "../options";
import ChoiceGrid from "./ChoiceGrid";

interface BodyStepProps {
  unit: WeightUnit;
  sex: Profile["sex"];
  weight: string;
  onUnit: (unit: WeightUnit) => void;
  onSex: (sex: NonNullable<Profile["sex"]>) => void;
  onWeight: (weight: string) => void;
}

const UNITS = [
  { value: "kg", label: "kg" },
  { value: "lb", label: "lb" },
] as const;

export default function BodyStep({
  unit,
  sex,
  weight,
  onUnit,
  onSex,
  onWeight,
}: BodyStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <ChoiceGrid options={[...UNITS]} value={unit} onSelect={onUnit} />
      <label className="flex flex-col gap-1 text-sm font-medium">
        Body weight ({unit}, optional)
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.1"
          value={weight}
          onChange={(e) => onWeight(e.target.value)}
        />
      </label>
      <p className="text-sm text-muted-foreground">
        Used to compare your lifts with strength standards.
      </p>
      <ChoiceGrid options={SEXES} value={sex} onSelect={onSex} />
    </div>
  );
}
