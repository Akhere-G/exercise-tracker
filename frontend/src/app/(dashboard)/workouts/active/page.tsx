import { getRoutineById } from "@/src/features/routines/queries";
import { getExerciseSettings } from "@/src/features/profile/queries";
import { getPreviousSetsForExercises } from "@/src/features/workout/actions";
import WorkoutClientProvider from "./components/WorkoutClientProvider";

export default async function ActiveWorkout({
  searchParams,
}: {
  searchParams: Promise<{ routineId: number }>;
}) {
  const { routineId } = await searchParams;

  const [response, settingsResponse] = await Promise.all([
    getRoutineById(routineId),
    getExerciseSettings(),
  ]);
  const routine = response.success ? response.data : null;
  const exerciseSettings = settingsResponse.success
    ? settingsResponse.data
    : [];

  // Last session's sets are needed up front so new sets start from them.
  const previousResponse = routine
    ? await getPreviousSetsForExercises(
        routine.routineItems.map((item) => item.exerciseId),
      )
    : null;
  const initialPreviousSets = previousResponse?.success
    ? previousResponse.data
    : null;

  return (
    <WorkoutClientProvider
      routine={routine}
      exerciseSettings={exerciseSettings}
      initialPreviousSets={initialPreviousSets}
    />
  );
}
