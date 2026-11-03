"use client";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useWeightUnit } from "@/src/features/profile/components/ProfileProvider";
import { track } from "@/src/features/analytics/utils";
import { Exercise, useWorkout } from "@/src/features/workout/store";
import { isWorkingSet } from "@/src/features/workout/utils";
import { formatWeight } from "@/src/lib/units";
import { getProgressionSuggestions } from "../actions";
import { ProgressionSuggestion } from "../types";

const chipLabel = (suggestion: ProgressionSuggestion, unit: "kg" | "lb") => {
  const reps = suggestion.reps ?? "";
  return suggestion.weight === null
    ? `Try ${reps} reps`
    : `Try ${formatWeight(suggestion.weight, unit)} × ${reps}`;
};

/** Fills the sets still to do with the suggested weight and reps. */
const applySuggestion = (
  exercise: Exercise,
  suggestion: ProgressionSuggestion,
): Exercise => ({
  ...exercise,
  sets: exercise.sets.map((set) => {
    if (set.isCompleted || !isWorkingSet(set)) return set;
    return {
      ...set,
      reps: suggestion.reps ?? set.reps,
      weight:
        set.weight !== undefined && suggestion.weight !== null
          ? suggestion.weight
          : set.weight,
    };
  }),
});

export default function ProgressionChip({ exercise }: { exercise: Exercise }) {
  const unit = useWeightUnit();
  const { exercises, setWorkoutData } = useWorkout();
  const [loaded, setLoaded] = useState<{
    exerciseId: number;
    suggestion: ProgressionSuggestion | null;
  } | null>(null);

  const exerciseId = exercise.id;
  useEffect(() => {
    let cancelled = false;
    getProgressionSuggestions([exerciseId]).then((response) => {
      if (cancelled || !response.success) return;
      setLoaded({ exerciseId, suggestion: response.data[0] ?? null });
    });
    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  const suggestion =
    loaded?.exerciseId === exerciseId ? loaded.suggestion : null;

  const hasSetsToDo = exercise.sets.some((s) => !s.isCompleted);
  if (!suggestion || !hasSetsToDo) return null;

  const apply = () => {
    track("apply_progression", { action: suggestion.action });
    setWorkoutData({
      exercises: exercises.map((e) =>
        e.id === exerciseId ? applySuggestion(e, suggestion) : e,
      ),
    });
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <Button type="button" size="sm" variant="secondary" onClick={apply}>
        <Sparkles size={14} />
        {chipLabel(suggestion, unit)}
      </Button>
      <p className="text-xs text-secondary-foreground">{suggestion.reason}</p>
    </div>
  );
}
