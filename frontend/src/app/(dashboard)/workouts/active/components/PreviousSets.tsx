"use client";

import { getPreviousSets } from "@/src/features/workout/actions";
import { useWorkout } from "@/src/features/workout/store";
import { WorkoutSet } from "@/src/features/workout/types";
import { getSetVolume } from "@/src/features/workout/utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function PreviousSets() {
  const [previousSets, setPreviousSets] = useState<WorkoutSet[]>([]);
  const currentExerciseId = useWorkout((state) => state.currentExerciseId);

  useEffect(() => {
    async function fetchPreviousSets() {
      const response = await getPreviousSets(currentExerciseId);

      if (response.success) {
        setPreviousSets(response.data);
      } else {
        toast.error(response.error);
      }
    }

    fetchPreviousSets();
  }, [currentExerciseId]);

  if (previousSets.length === 0) return null;

  return (
    <div className="container mt-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Previous Workout
      </p>

      <PreviousSetList sets={previousSets} />
    </div>
  );
}

function PreviousSetList({ sets }: { sets: WorkoutSet[] }) {
  return (
    <div className="rounded-md border border-border/40 bg-muted/20 px-3 py-2">
      <table className="w-full text-xs">
        <tbody>
          {sets.map((set) => (
            <PreviousSetRow
              key={`${set.exerciseId}_${set.setIndex}`}
              set={set}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface SetRowProps {
  set: WorkoutSet;
}

function PreviousSetRow({ set }: SetRowProps) {
  return (
    <tr className="border-b border-border/20 last:border-b-0">
      <td className="w-8 py-1 text-muted-foreground">{set.setIndex}</td>

      <td className="py-1 text-muted-foreground">
        <span>{getSetVolume(set.exercise, set)}</span>
      </td>
    </tr>
  );
}
