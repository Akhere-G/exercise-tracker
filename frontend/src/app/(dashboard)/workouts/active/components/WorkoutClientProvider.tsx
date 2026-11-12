"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import ExerciseDetails from "./ExerciseDetails";
import SetList from "../../../routines/components/SetList";
import RestTimeTracker from "./RestTimeTracker";
import { Routine } from "@/src/features/routines/types";
import {
  Exercise,
  useWorkout,
  WorkoutState,
  workoutStorageKey,
} from "@/src/features/workout/store";
import ExerciseList from "./ExerciseList";
import {
  getActiveSupersetGroup,
  getDefaultSets,
  isWorkoutCompleted,
} from "@/src/features/workout/utils";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { WorkoutSchema } from "@/src/features/workout/schema";
import {
  createWorkout,
  getPreviousSetsForExercises,
} from "@/src/features/workout/actions";
import { PreviousSet } from "@/src/features/workout/types";
import { ExerciseSetting } from "@/src/features/profile/types";
import { WorkoutContextProvider } from "@/src/features/workout/components/WorkoutContext";

import { useRouter } from "next/navigation";
import PostWorkoutReuseDialog, {
  ReuseTarget,
} from "@/src/features/routines/components/PostWorkoutReuseDialog";
import {
  diffRoutine,
  hasRoutineDiff,
  PerformedExercise,
} from "@/src/features/routines/utils";
import { getFailureReason, track } from "@/src/features/analytics/utils";

export default function WorkoutClientProvider({
  routine,
  exerciseSettings = [],
  initialPreviousSets = null,
}: {
  routine: Routine | null;
  exerciseSettings?: ExerciseSetting[];
  initialPreviousSets?: Record<number, PreviousSet[]> | null;
}) {
  const { setWorkoutData, exercises, startedAt, resetState } = useWorkout();
  const router = useRouter();
  const hasTrackedStart = useRef(false);
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reuseTarget, setReuseTarget] = useState<ReuseTarget | null>(null);
  const [previousSets, setPreviousSets] = useState<
    Record<number, PreviousSet[]>
  >(initialPreviousSets ?? {});
  const previousRef = useRef<Record<number, PreviousSet[]>>(
    initialPreviousSets ?? {},
  );
  const loadedPreviousIds = useRef(
    new Set<number>(
      initialPreviousSets
        ? (routine?.routineItems.map((item) => item.exerciseId) ?? [])
        : [],
    ),
  );
  const [restSettings, setRestSettings] = useState<
    Record<number, number | null>
  >(() =>
    Object.fromEntries(exerciseSettings.map((s) => [s.exerciseId, s.restSecs])),
  );

  const setRestSetting = useCallback(
    (exerciseId: number, restSecs: number | null) =>
      setRestSettings((current) => ({ ...current, [exerciseId]: restSecs })),
    [],
  );

  const ensurePreviousSets = useCallback(async (exerciseIds: number[]) => {
    const missing = exerciseIds.filter(
      (id) => !loadedPreviousIds.current.has(id),
    );

    if (missing.length > 0) {
      const response = await getPreviousSetsForExercises(missing);
      if (response.success) {
        missing.forEach((id) => loadedPreviousIds.current.add(id));
        previousRef.current = { ...previousRef.current, ...response.data };
        setPreviousSets(previousRef.current);
      }
    }

    return previousRef.current;
  }, []);

  const exerciseIdsKey = exercises.map((e) => e.id).join(",");
  useEffect(() => {
    ensurePreviousSets(exerciseIdsKey.split(",").filter(Boolean).map(Number));
  }, [exerciseIdsKey, ensurePreviousSets]);

  const contextValue = useMemo(
    () => ({
      previousSets,
      ensurePreviousSets,
      restSettings,
      setRestSetting,
    }),
    [previousSets, ensurePreviousSets, restSettings, setRestSetting],
  );

  useEffect(() => {
    try {
      const workoutJson = localStorage.getItem(workoutStorageKey);

      if (workoutJson) {
        const workoutData: { state: WorkoutState } = JSON.parse(workoutJson);

        setWorkoutData(workoutData.state);
        return;
      }
    } catch {}

    if (!routine) return;

    const exercises: Exercise[] = [];

    for (const item of routine.routineItems) {
      const { exercise } = item;
      const exerciseItem: Exercise = {
        ...exercise,
        sets: getDefaultSets(exercise, undefined, {
          routineItem: item,
          previousSets: initialPreviousSets?.[exercise.id],
        }),
        restSecs: item.restSecs ?? null,
        supersetGroup: item.supersetGroup ?? null,
      };

      exercises.push(exerciseItem);
    }

    setWorkoutData({
      routineId: routine.id,
      routineName: routine.name,
      currentExerciseId: routine.routineItems[0]?.exerciseId ?? 0,
      exercises,
      startedAt: new Date(),
    });

    if (!hasTrackedStart.current) {
      hasTrackedStart.current = true;
      track("start_workout", { source: "routine" });
    }
  }, [routine, setWorkoutData]);

  const goToSummary = (workoutId: number) =>
    setTimeout(() => router.push(`/workouts/summary/${workoutId}?first=true`));

  async function completeWorkout(onComplete?: () => void) {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    let saved = false;
    const completedAt = new Date();
    const durationInMs = startedAt
      ? completedAt.getTime() - new Date(startedAt).getTime()
      : 0;
    const duration = Math.max(0, Math.floor(durationInMs / 1000));
    const workout: WorkoutSchema = {
      completedAt,
      duration,
      routineId: routine?.id,
      sets: exercises.flatMap((e) => {
        const group = getActiveSupersetGroup(exercises, e);
        return e.sets
          .filter((s) => s.isCompleted)
          .map((s) => ({ ...s, supersetGroup: group }));
      }),
    };
    try {
      const response = await createWorkout(workout);
      if (response.success) {
        const newWorkout = response.data;
        track("complete_workout", {
          workout_id: newWorkout.id,
          duration_seconds: duration,
          set_count: workout.sets.length,
          exercise_count: exercises.filter((e) =>
            e.sets.some((s) => s.isCompleted),
          ).length,
          has_routine: routine !== null,
        });
        saved = true;
        if (newWorkout.durationCapped) {
          toast.warning(
            "Workout time was shortened to 3 hours because it was too long.",
          );
        }

        const performed: PerformedExercise[] = exercises.flatMap((e) => {
          const done = e.sets.filter((s) => s.isCompleted);
          const working = done.filter((s) => s.setType !== "warmup");
          return done.length > 0
            ? [
                {
                  exerciseId: e.id,
                  name: e.name,
                  sets: (working.length ? working : done).length,
                },
              ]
            : [];
        });
        const diff = routine
          ? diffRoutine(routine.routineItems, performed)
          : null;
        const offerReuse = !routine || (diff !== null && hasRoutineDiff(diff));

        resetState();
        localStorage.removeItem(workoutStorageKey);
        onComplete?.();

        if (offerReuse) {
          setReuseTarget({
            workoutId: newWorkout.id,
            routine: routine ? { id: routine.id, name: routine.name } : null,
            diff,
            suggestedName: routine?.name ?? "My workout",
          });
        } else {
          goToSummary(newWorkout.id);
        }
      } else {
        track("create_workout_failed", { reason: getFailureReason(response) });
        toast.error(response.error);
      }
    } catch {
      track("create_workout_failed", { reason: "exception" });
      toast.error("Could not save workout.");
    } finally {
      if (!saved) {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    }
  }

  const canComplete = isWorkoutCompleted(exercises) && exercises.length > 0;
  return (
    <WorkoutContextProvider value={contextValue}>
    <div className="relative  h-[90vh] flex flex-1 flex-col justify-between">
      <div>
        <ExerciseList />
        <ExerciseDetails
          completeWorkout={completeWorkout}
          isCompleting={isSubmitting}
          canComplete={exercises
            .flatMap((e) => e.sets)
            .some((s) => s.isCompleted)}
        />
        <SetList routine={routine} />
      </div>
      <RestTimeTracker />

      <div
        className={`fixed left-0 w-full px-4 transition-all duration-300 ${canComplete ? "bottom-32 opacity-100" : "-bottom-full opacity-0"}`}
      >
        <Button
          onClick={() => completeWorkout()}
          disabled={isSubmitting}
          className="w-full shadow-2xl"
        >
          Complete Workout
        </Button>
      </div>
    </div>
    {reuseTarget && (
      <PostWorkoutReuseDialog
        target={reuseTarget}
        onDone={() => goToSummary(reuseTarget.workoutId)}
      />
    )}
    </WorkoutContextProvider>
  );
}
