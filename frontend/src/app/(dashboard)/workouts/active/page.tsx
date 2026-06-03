import { getRoutineById } from "@/src/features/routines/api";
import WorkoutClientProvider from "./components/WorkoutClientProvider";

export default async function ActiveWorkout({
  searchParams,
}: {
  searchParams: Promise<{ routineId: number }>;
}) {
  const { routineId } = await searchParams;

  const response = await getRoutineById(routineId);
  const routine = response.success ? response.data : null;

  return <WorkoutClientProvider routine={routine} />;
}
