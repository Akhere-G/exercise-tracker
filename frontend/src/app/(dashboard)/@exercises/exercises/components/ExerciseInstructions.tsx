import { Exercise } from "@/src/features/exercises/types";
import BodyChart from "../../../workouts/summary/[workoutId]/components/BodyChart";
import { getMuscleMapData } from "@/src/features/exercises/utils";

export default function ExerciseInstructions({
  exercise,
}: {
  exercise: Exercise;
}) {
  const { instructions } = exercise;

  const data = getMuscleMapData([exercise]);

  return (
    <div>
      <p>{instructions}</p>

      <div className="flex justify-center ">
        <BodyChart data={data} side="front" />
        <BodyChart data={data} side="back" />
      </div>
    </div>
  );
}
