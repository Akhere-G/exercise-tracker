"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { track } from "@/src/features/analytics/utils";
import { getDayStr } from "@/src/features/routines/utils";
import { cn } from "@/src/lib/componentUtils";
import { buildRoutine, savePreview } from "../actions";
import { buildRoutineSchema, EQUIPMENT_OPTIONS, GOAL_OPTIONS } from "../schema";
import { Equipment, Persona, RoutinePreview } from "../types";

export default function RoutineBuilder({ persona }: { persona?: Persona }) {
  const router = useRouter();
  const [goal, setGoal] = useState("hypertrophy");
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [minutes, setMinutes] = useState("45");
  const [daysPerWeek, setDaysPerWeek] = useState("3");
  const [focus, setFocus] = useState("");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<RoutinePreview | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const toggleEquipment = (value: Equipment) =>
    setEquipment((current) =>
      current.includes(value)
        ? current.filter((e) => e !== value)
        : [...current, value],
    );

  const generate = async (event?: React.FormEvent) => {
    event?.preventDefault();
    let request;
    try {
      request = buildRoutineSchema.validateSync({
        goal,
        equipment,
        minutes: minutes === "" ? undefined : Number(minutes),
        daysPerWeek: daysPerWeek === "" ? undefined : Number(daysPerWeek),
        focus: focus || undefined,
        notes: notes || undefined,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check your entries");
      return;
    }

    setIsBusy(true);
    setUnavailable(null);
    const response = await buildRoutine(request);
    setIsBusy(false);

    if (response.success) {
      track("build_routine", { day_count: response.data.routines.length });
      setPreview(response.data);
    } else if (response.status === 503) {
      setUnavailable(response.error ?? "The coach is unavailable.");
    } else {
      toast.error(response.error);
    }
  };

  const save = async () => {
    if (!preview) return;
    setIsBusy(true);
    const response = await savePreview(preview);
    setIsBusy(false);

    if (!response.success) {
      toast.error(response.error);
      return;
    }
    toast.success(`Saved ${response.data.length} routines`);
    router.push("/routines");
  };

  return (
    <div className="flex flex-col gap-6">
      {persona && (
        <p className="text-sm text-secondary-foreground">
          Your coach: <strong>{persona.name}</strong>. {persona.tagline}
        </p>
      )}

      <form onSubmit={generate} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Goal
          <select value={goal} onChange={(e) => setGoal(e.target.value)}>
            {GOAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Equipment you have</legend>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={equipment.includes(o.value)}
                onClick={() => toggleEquipment(o.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm",
                  equipment.includes(o.value) &&
                    "border-primary bg-primary text-primary-foreground",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Minutes per session
            <Input
              type="number"
              inputMode="numeric"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Days per week
            <Input
              type="number"
              inputMode="numeric"
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(e.target.value)}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Focus (optional)
          <Input
            value={focus}
            maxLength={100}
            placeholder="e.g. bigger arms"
            onChange={(e) => setFocus(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Notes (optional)
          <Input
            value={notes}
            maxLength={500}
            placeholder="e.g. bad left shoulder"
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <Button type="submit" disabled={isBusy}>
          {isBusy && !preview ? "Building…" : "Build my plan"}
        </Button>
      </form>

      {unavailable && (
        <div role="alert" className="rounded-lg border p-4 text-sm">
          <p>{unavailable}</p>
          <Link href="/programs" className="mt-2 inline-block underline">
            Browse prebuilt programs
          </Link>
        </div>
      )}

      {preview && (
        <section className="flex flex-col gap-4">
          <p className="text-sm">{preview.rationale}</p>
          {preview.routines.map((routine) => (
            <div
              key={`${routine.name}-${routine.day}`}
              className="rounded-lg border bg-card p-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-semibold">{routine.name}</h3>
                <span className="text-xs text-secondary-foreground">
                  {getDayStr(routine.day)}
                </span>
              </div>
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {routine.items.map((item) => (
                  <li
                    key={item.exerciseId}
                    className="flex justify-between gap-2"
                  >
                    <span className="capitalize">{item.name}</span>
                    <span className="text-secondary-foreground">
                      {item.sets} × {item.reps}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={isBusy}
              onClick={() => generate()}
            >
              Regenerate
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={isBusy}
              onClick={save}
            >
              Save routines
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
