import { Button } from "@/src/components/ui/button";
import { Exercise, useWorkout } from "@/src/features/workout/store";
import { useState } from "react";
import { ExercisePickerModal } from "../../../routines/components/ExercisePickerModal";
import { Exercise as BaseExercise } from "@/src/features/exercises/types";
import { Check, Plus } from "lucide-react";
import {
  getActiveSupersetGroup,
  getDefaultSets,
  isExerciseCompleted,
} from "@/src/features/workout/utils";
import { ExerciseImage } from "../../components/ExerciseImage";
import { useRouter } from "next/navigation";
import { useEnsurePreviousSets } from "@/src/features/workout/components/WorkoutContext";

const SUPERSET_COLOURS = ["bg-primary", "bg-warning", "bg-info"];

export default function ExerciseList() {
  const [isOpen, setIsOpen] = useState(false);

  const { currentExerciseId, setWorkoutData, exercises } = useWorkout();
  const router = useRouter();
  const ensurePreviousSets = useEnsurePreviousSets();
  const onClick = (exerciseId: number) => {
    if (exerciseId === currentExerciseId) {
      router.push(`/exercises/${exerciseId}`);
    } else {
      setWorkoutData({ currentExerciseId: exerciseId });
    }
  };

  async function addExercises(newExercises: BaseExercise[]) {
    const previous = await ensurePreviousSets(newExercises.map((e) => e.id));

    // Read the store again: it may have changed while the sets were loading.
    const { exercises: latest, currentExerciseId: latestCurrentId } =
      useWorkout.getState();
    const exisitingExerciseLookup = new Set(latest.map((e) => e.id));

    const exercisesToAdd: Exercise[] = newExercises
      .filter((e) => !exisitingExerciseLookup.has(e.id))
      .map((e) => ({
        ...e,
        sets: getDefaultSets(e, undefined, { previousSets: previous[e.id] }),
      }));

    if (exercisesToAdd.length > 0) {
      setWorkoutData({
        exercises: [...latest, ...exercisesToAdd],
        currentExerciseId:
          latest.length === 0 ? exercisesToAdd[0].id : latestCurrentId,
      });
    }

    setIsOpen(false);
  }

  const { totalSets, completedSets } = exercises.reduce(
    (acc, exercise) => {
      acc.totalSets += exercise.sets.length;
      acc.completedSets += exercise.sets.filter(
        (set) => set.isCompleted,
      ).length;
      return acc;
    },
    { totalSets: 0, completedSets: 0 },
  );

  const noExercises = exercises.length === 0;
  return (
    <div className="flex flex-col">
      <div className="px-2 py-4 bg-secondary overflow-x-scroll">
        <div className="flex gap-2 w-max">
          {!!exercises.length &&
            exercises.map((item) => {
              const group = getActiveSupersetGroup(exercises, item);
              return (
                <div
                  key={item.id}
                  className={`relative transition-opacity duration-300 ${currentExerciseId === item.id ? "cursor-pointer" : "opacity-50"}`}
                  onClick={() => onClick(item.id)}
                >
                  <ExerciseImage exercise={item} />
                  {isExerciseCompleted(item) && (
                    <Check className="absolute right-1 bottom-1 bg-white w-5 h-5 rounded-full text-success " />
                  )}
                  {group !== null && (
                    <span
                      title={`Superset ${group}`}
                      className={`absolute -bottom-2 left-0 right-0 h-1 rounded-full ${SUPERSET_COLOURS[(group - 1) % SUPERSET_COLOURS.length]}`}
                    />
                  )}
                </div>
              );
            })}
          <Button
            className={`h-12 ${noExercises ? "" : "w-17"}`}
            onClick={() => setIsOpen(true)}
          >
            {noExercises && "Add Exercise"}

            <Plus />
          </Button>
        </div>
      </div>
      <progress
        className="progress-bar"
        value={completedSets}
        max={totalSets}
      />
      <ExercisePickerModal
        isOpen={isOpen}
        addedExercises={exercises}
        onClose={() => setIsOpen(false)}
        onSelect={addExercises}
      />
    </div>
  );
}
