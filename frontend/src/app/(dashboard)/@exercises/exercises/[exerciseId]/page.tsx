import { getUserAchievementsForExercise } from "@/src/features/achievements/actions";
import ExerciseDetails from "../components/ExerciseDetails";
import {
  getExerciseById,
  getWorkoutsForExercise,
} from "@/src/features/exercises/queries";
export default async function ExerciseDetailsPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const exerciseId = Number((await params).exerciseId);

  const response = await getExerciseById(exerciseId);
  const workoutReponse = await getWorkoutsForExercise(exerciseId);
  const exercise = response.success ? response.data : null;
  const workoutSets = workoutReponse.success ? workoutReponse.data : null;
  const achievementsPromise = getUserAchievementsForExercise(exerciseId);
  return (
    <ExerciseDetails
      exercise={exercise}
      workoutSets={workoutSets}
      achievementsPromise={achievementsPromise}
    />
  );
}
