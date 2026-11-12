"use client";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import TimeInput from "@/src/components/ui/timeInput";
import { Check } from "lucide-react";
import { ActiveSet, Exercise, useWorkout } from "@/src/features/workout/store";
import { Routine, RoutineItem } from "@/src/features/routines/types";
import {
  isCardioExercise,
  isDurationExercise,
  isRepsExercise,
  isWeightsExercise,
} from "@/src/features/exercises/utils";
import {
  DEFAULT_REST_SECS,
  formatPreviousSet,
  getActiveSupersetGroup,
  getNewSet,
  getPreviousForSet,
  getSetLabel,
  getSupersetMembers,
  isExerciseCompleted,
  nextSetType,
} from "@/src/features/workout/utils";
import { useTimer } from "@/src/features/timer/store";
import { toast } from "sonner";
import { useState } from "react";
import { useProfile } from "@/src/features/profile/components/ProfileProvider";
import {
  usePreviousSets,
  useRestSettings,
} from "@/src/features/workout/components/WorkoutContext";
import { PreviousSet } from "@/src/features/workout/types";
import { toDisplayWeight, toKg } from "@/src/lib/units";

const RPE_OPTIONS = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];
const RIR_OPTIONS = [0, 1, 2, 3, 4, 5];

const SET_TYPE_STYLES: Record<string, string> = {
  warmup: "text-warning",
  drop: "text-info",
  failure: "text-destructive",
};

const SET_TYPE_NAMES: Record<string, string> = {
  normal: "Working set",
  warmup: "Warm-up (not counted in volume or records)",
  drop: "Drop set",
  failure: "Failure set",
};

function SetInput({
  value,
  onChange,
  canBeZero,
  canBeNegative,
  "aria-label": ariaLabel,
}: {
  value: number | string;
  onChange?: (val: string) => void;
  canBeZero?: boolean;
  canBeNegative?: boolean;
  "aria-label"?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [dirtyValue, setDirtyValue] = useState("");

  const updateValue = () => {
    if (Number(dirtyValue.trim()) || (dirtyValue.trim() === "0" && canBeZero)) {
      let value = dirtyValue;

      if (!canBeNegative) {
        value = Math.abs(Number(dirtyValue)).toString();
      }
      onChange?.(value);
      setDirtyValue(value);
    }
    setIsEditing(false);
  };
  return (
    <Input
      type="number"
      aria-label={ariaLabel}
      className="w-16 h-10 text-center font-medium bg-transparent! border-none placeholder-muted-foreground"
      placeholder={value.toString()}
      value={isEditing ? dirtyValue : value}
      onFocus={() => setIsEditing(true)}
      onChange={(e) => setDirtyValue(e.target.value)}
      onKeyDownCapture={(e) => {
        if (e.key == "Enter") {
          e.currentTarget.blur();
        }
      }}
      onBlur={updateValue}
    />
  );
}

interface SetRowProps {
  set: ActiveSet;
  sets: ActiveSet[];
  exercise: Exercise;
  previous?: PreviousSet;
  hasReps: boolean;
  hasWeight: boolean;
  hasDuration: boolean;
  hasDistance: boolean;
}

function SetRow({
  set,
  sets,
  exercise,
  previous,
  hasReps,
  hasWeight,
  hasDuration,
  hasDistance,
}: SetRowProps) {
  const { setWorkoutData, exercises, currentExerciseId } = useWorkout();
  const { start, clear } = useTimer();
  const { weightUnit, effortMetric } = useProfile();
  const { restSettings } = useRestSettings();

  const updateSet = (patch: Partial<ActiveSet>) => {
    const newExercises = exercises.map((e) =>
      e.id === currentExerciseId
        ? {
            ...e,
            sets: e.sets.map((s) =>
              s.setIndex === set.setIndex ? { ...s, ...patch } : s,
            ),
          }
        : e,
    );
    setWorkoutData({
      exercises: newExercises,
    });

    return newExercises;
  };

  /**
   * Inside a superset the next exercise follows straight away and the rest
   * timer only starts once every exercise in the round is done.
   */
  const advanceAfterCompleting = (newExercises: Exercise[]) => {
    const current = newExercises.find((e) => e.id === currentExerciseId);
    if (!current) return;

    let nextId: number | undefined;
    let shouldRest = true;

    const group = getActiveSupersetGroup(newExercises, current);
    if (group !== null) {
      const members = getSupersetMembers(newExercises, group);
      const position = members.findIndex((m) => m.id === current.id);
      const later = members
        .slice(position + 1)
        .find((m) => !isExerciseCompleted(m));

      if (later) {
        nextId = later.id;
        shouldRest = false;
      } else {
        nextId = members.find((m) => !isExerciseCompleted(m))?.id;
      }
    }

    if (nextId === undefined && isExerciseCompleted(current)) {
      nextId = newExercises.find((e) => !isExerciseCompleted(e))?.id;
    }

    if (newExercises.some((e) => !isExerciseCompleted(e))) {
      if (shouldRest) {
        const restFor = (e: Exercise) =>
          e.restSecs ?? restSettings[e.id] ?? null;
        const round = group !== null ? getSupersetMembers(newExercises, group) : [];
        const restSecs =
          restFor(current) ??
          round.map(restFor).find((secs) => secs !== null) ??
          DEFAULT_REST_SECS;
        start(restSecs);
      }
    } else {
      clear();
    }

    if (nextId !== undefined && nextId !== current.id) {
      setWorkoutData({ currentExerciseId: nextId });
    }
  };

  function handleClick() {
    if (!set.isCompleted && Number(set.reps) < 1)
      return toast.error("Cannot complete set with reps less than 1.");

    const newExercises = updateSet({ isCompleted: !set.isCompleted });
    if (!set.isCompleted) {
      advanceAfterCompleting(newExercises);
    }
  }

  function prefillFromPrevious() {
    if (!previous) return;
    updateSet({
      ...(hasWeight && previous.weight != null
        ? { weight: previous.weight }
        : {}),
      ...(hasReps && previous.reps != null ? { reps: previous.reps } : {}),
      ...(hasDuration && previous.durationSecs != null
        ? { durationSecs: previous.durationSecs }
        : {}),
      ...(hasDistance && previous.distanceMeters != null
        ? { distanceMeters: previous.distanceMeters }
        : {}),
    });
  }

  const setType = set.setType ?? "normal";

  return (
    <tr
      className={`group transition-colors ${set.isCompleted ? "bg-success/50 " : ""}`}
    >
      <td className="py-2 px-2 font-semibold text-secondary-foreground">
        <button
          type="button"
          title={`${SET_TYPE_NAMES[setType]}. Tap to change type.`}
          aria-label={`Set ${set.setIndex}: ${SET_TYPE_NAMES[setType]}. Tap to change type.`}
          className={`block w-6 text-left ${SET_TYPE_STYLES[setType] ?? ""}`}
          onClick={() => updateSet({ setType: nextSetType(set.setType) })}
        >
          {getSetLabel(sets, set)}
        </button>
        {previous && (
          <button
            type="button"
            className="block text-[10px] font-normal text-muted-foreground whitespace-nowrap hover:underline"
            title="Use last session's values"
            aria-label={`Use last session's ${formatPreviousSet(exercise, previous, weightUnit)}`}
            onClick={prefillFromPrevious}
          >
            {formatPreviousSet(exercise, previous, weightUnit)}
          </button>
        )}
      </td>

      {hasWeight && (
        <td>
          <SetInput
            value={
              set.weight == null || String(set.weight) === ""
                ? ""
                : toDisplayWeight(Number(set.weight), weightUnit)
            }
            aria-label={`Set ${set.setIndex} weight`}
            onChange={(value) =>
              updateSet({ weight: toKg(Number(value), weightUnit) })
            }
            canBeZero
            canBeNegative
          />
        </td>
      )}
      {hasReps && (
        <td>
          <SetInput
            value={set.reps ?? ""}
            aria-label={`Set ${set.setIndex} reps`}
            onChange={(value) => updateSet({ reps: Number(value) })}
          />
        </td>
      )}
      {hasDuration && (
        <td>
          <TimeInput
            className="bg-transparent! border-none! w-auto!"
            value={set.durationSecs ?? ""}
            aria-label={`Set ${set.setIndex} duration`}
            onChange={(value) => updateSet({ durationSecs: Number(value) })}
          />
        </td>
      )}
      {hasDistance && (
        <td>
          <SetInput
            value={set.distanceMeters ?? ""}
            aria-label={`Set ${set.setIndex} distance`}
            onChange={(value) => updateSet({ distanceMeters: Number(value) })}
          />
        </td>
      )}
      {effortMetric !== "off" && (
        <td className="px-1">
          <select
            aria-label={effortMetric === "rpe" ? "RPE" : "Reps in reserve"}
            className="h-10 w-16 bg-transparent! border-none! text-center"
            value={
              (effortMetric === "rpe" ? set.rpe : set.rir)?.toString() ?? ""
            }
            onChange={(e) => {
              const value =
                e.target.value === "" ? null : Number(e.target.value);
              updateSet(
                effortMetric === "rpe" ? { rpe: value } : { rir: value },
              );
            }}
          >
            <option value="">–</option>
            {(effortMetric === "rpe" ? RPE_OPTIONS : RIR_OPTIONS).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </td>
      )}
      <td className="py-3 px-2">
        <Button
          variant="ghost"
          className={"h-10 w-10 p-0 hover:text-green-600"}
          onClick={handleClick}
          aria-label={set.isCompleted ? "Mark set incomplete" : "Complete set"}
        >
          <Check size={18} />
        </Button>
      </td>
    </tr>
  );
}

export default function SetList({ routine }: { routine: Routine | null }) {
  const { exercises, currentExerciseId, setWorkoutData } = useWorkout();
  const { weightUnit, effortMetric } = useProfile();
  const previousSets = usePreviousSets();

  const currentExercise = exercises.find((e) => e.id === currentExerciseId);
  const sets = currentExercise?.sets ?? [];

  const hasReps = !!currentExercise && isRepsExercise(currentExercise);
  const hasWeight = !!currentExercise && isWeightsExercise(currentExercise);
  const hasDuration = !!currentExercise && isDurationExercise(currentExercise);
  const hasDistance = !!currentExercise && isCardioExercise(currentExercise);

  const addSet = () => {
    if (!currentExercise) return;

    const routineItems: Record<number, RoutineItem> = {};
    routine?.routineItems.forEach((r) => {
      routineItems[r.exerciseId] = r;
    });

    setWorkoutData({
      exercises: exercises.map((e) =>
        e.id === currentExerciseId
          ? { ...e, sets: e.sets.concat(getNewSet(e, routineItems[e.id], previousSets[e.id])) }
          : e,
      ),
    });
  };
  if (!currentExercise) return null;

  const previous = previousSets[currentExercise.id] ?? [];

  return (
    <div className="bg-secondary mt-4 text-secondary-foreground py-4 flex flex-col gap-4 max-h-[54vh] overflow-y-scroll">
      <table className="w-full text-sm">
        <thead className="table-header-group">
          <tr className="text-secondary-foreground font-medium uppercase tracking-wider text-xs text-left">
            <th className="pb-3 px-2">Set</th>
            {hasWeight && <th className="pb-3 px-2">{weightUnit}</th>}
            {hasReps && <th className="pb-3 px-2">Reps</th>}
            {hasDuration && <th className="pb-3 px-2">Mins</th>}
            {hasDistance && <th className="pb-3 px-2">Meters</th>}
            {effortMetric !== "off" && (
              <th className="pb-3 px-2">{effortMetric.toUpperCase()}</th>
            )}
            <th className="pb-3 px-2 w-16"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-muted-foreground">
          {sets.map((set) => (
            <SetRow
              key={`${set.exerciseId}_${set.setIndex}`}
              set={set}
              sets={sets}
              exercise={currentExercise}
              previous={getPreviousForSet(previous, sets, set)}
              hasReps={hasReps}
              hasWeight={hasWeight}
              hasDuration={hasDuration}
              hasDistance={hasDistance}
            />
          ))}
        </tbody>
      </table>
      <Button className=" mx-2" onClick={addSet}>
        Add{" "}
      </Button>
    </div>
  );
}
