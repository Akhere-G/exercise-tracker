import { getRoutineById } from "@/src/features/routines/api";
import WorkoutClientProvider from "./components/WorkoutClientProvider";

export default async function ActiveWorkout({
  searchParams,
}: {
  searchParams: Promise<{ routineId: number }>;
}) {
  const { routineId } = await searchParams;

  const routine = await getRoutineById(routineId);

  return <WorkoutClientProvider routine={routine} />;
}
