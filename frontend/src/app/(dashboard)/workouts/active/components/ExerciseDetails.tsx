import { Button } from "@/src/components/ui/button";
import { Routine } from "@/src/features/routines/types";
import { useWorkout } from "@/src/features/workout/store";
import { MoreVertical } from "lucide-react";

export default function ExerciseDetails({
  routine,
}: {
  routine: Routine | null;
}) {
  const { currentExerciseId, exercises } = useWorkout();

  if (!routine) return;

  const currentExercise = exercises.find((e) => e.id === currentExerciseId);

  if (!currentExercise) return;

  return (
    <div className="mt-4 px-2">
      <div className="flex gap-2 justify-between items-start">
        <div className="">
          <h2>{currentExercise.name}</h2>
          <p>{currentExercise.equipment}</p>
        </div>
        <Button>
          <MoreVertical />
        </Button>
      </div>
    </div>
  );
}
