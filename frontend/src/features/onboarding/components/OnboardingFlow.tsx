"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { track } from "@/src/features/analytics/utils";
import { Persona } from "@/src/features/ai/types";
import { Profile } from "@/src/features/profile/types";
import { toKg, WeightUnit } from "@/src/lib/units";
import { completeOnboarding, skipOnboarding } from "../actions";
import { EXPERIENCE, FREQUENCIES, GOALS, Option } from "../options";
import { onboardingSchema } from "../schema";
import BodyStep from "./BodyStep";
import ChoiceGrid from "./ChoiceGrid";

type Choice<K extends keyof Profile> = NonNullable<Profile[K]>;

const TITLES = [
  "What is your main goal?",
  "How experienced are you?",
  "How often do you want to train?",
  "A bit about you",
  "Pick your coach",
];

export default function OnboardingFlow({ personas }: { personas: Persona[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [goal, setGoal] = useState<Choice<"goal"> | null>(null);
  const [experience, setExperience] = useState<Choice<"experience"> | null>(
    null,
  );
  const [days, setDays] = useState<number | null>(null);
  const [unit, setUnit] = useState<WeightUnit>("kg");
  const [sex, setSex] = useState<Profile["sex"]>(null);
  const [weight, setWeight] = useState("");
  const [persona, setPersona] = useState<Persona["slug"]>("hype");

  const personaOptions: Option<string>[] = personas.map((p) => ({
    value: p.slug,
    label: p.name,
    description: p.tagline,
  }));
  const isLast = step === TITLES.length - 1;
  const ready = [goal, experience, days, sex, persona][step] !== null;

  const finish = async () => {
    setIsSaving(true);
    const response = await completeOnboarding(
      onboardingSchema.cast({
        goal,
        experience,
        workoutsPerWeek: days,
        weightUnit: unit,
        sex,
        bodyWeightKg: weight ? toKg(Number(weight), unit) : null,
        coachPersona: persona,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    );
    if (response.success) {
      track("complete_onboarding");
      router.replace("/routines");
      return;
    }
    setIsSaving(false);
    toast.error(response.error ?? "Could not save your answers.");
  };

  const skip = async () => {
    setIsSaving(true);
    await skipOnboarding();
    router.replace("/routines");
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Step {step + 1} of {TITLES.length}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">{TITLES[step]}</h1>
      </div>

      {step === 0 && (
        <ChoiceGrid options={GOALS} value={goal} onSelect={setGoal} />
      )}
      {step === 1 && (
        <ChoiceGrid
          options={EXPERIENCE}
          value={experience}
          onSelect={setExperience}
        />
      )}
      {step === 2 && (
        <ChoiceGrid options={FREQUENCIES} value={days} onSelect={setDays} />
      )}
      {step === 3 && (
        <BodyStep
          unit={unit}
          sex={sex}
          weight={weight}
          onUnit={setUnit}
          onSex={setSex}
          onWeight={setWeight}
        />
      )}
      {step === 4 && (
        <ChoiceGrid
          options={personaOptions}
          value={persona}
          onSelect={(slug) => setPersona(slug as Persona["slug"])}
        />
      )}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          disabled={isSaving}
          onClick={step === 0 ? skip : () => setStep(step - 1)}
        >
          {step === 0 ? "Skip" : "Back"}
        </Button>
        <Button
          type="button"
          disabled={!ready || isSaving}
          onClick={isLast ? finish : () => setStep(step + 1)}
        >
          {isLast ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
}
