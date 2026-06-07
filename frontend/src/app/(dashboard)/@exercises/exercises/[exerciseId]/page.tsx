import ExerciseDetails from "../components/ExerciseDetails";
import { getExerciseById } from "@/src/features/exercises/queries";
export default async function ExerciseDetailsPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const exerciseId = Number((await params).exerciseId);

  const response = await getExerciseById(exerciseId);
  const exercise = response.success ? response.data : null;

  return <ExerciseDetails exercise={exercise} />;
}
