import { getAllRoutines } from "@/src/features/routines/queries";
import RoutineCard from "./components/RoutineCard";
import Link from "next/link";
import StoredWorkout from "./components/StoredWorkout";
import NotificationsPrompt from "@/src/features/notifications/components/NotificationsPrompt";

export default async function Routines() {
  const response = await getAllRoutines();
  const routines = response.success ? response.data : [];

  return (
    <div className="container flex flex-col gap-4">
      <h2 className="text-2xl">Routines</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {routines.length === 0 ? (
          <div>
            <h3 className="text-center">No routines yet</h3>
          </div>
        ) : (
          routines.map((routine) => (
            <RoutineCard key={routine.id} routine={routine} />
          ))
        )}
      </div>
      <Link className="text-center text-foreground" href="/workouts/active">
        Start Empty Workout
      </Link>
      <Link className="text-center" href="/routines/create">
        Add New Routine
      </Link>
      <StoredWorkout />
      <NotificationsPrompt />
    </div>
  );
}
