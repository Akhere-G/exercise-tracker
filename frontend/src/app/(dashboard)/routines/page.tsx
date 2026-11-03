import { getAllRoutines } from "@/src/features/routines/queries";
import RoutineCard from "./components/RoutineCard";
import CreateRoutineLink from "./components/CreateRoutineLink";
import StoredWorkout from "./components/StoredWorkout";
import NotificationsPrompt from "@/src/features/notifications/components/NotificationsPrompt";
import StartEmptyWorkoutButton from "../components/StartEmptyWorkoutButton";
import DeloadBanner from "@/src/features/progression/components/DeloadBanner";
import { getDeloadAssessment } from "@/src/features/progression/queries";
import GoalsCard from "@/src/features/goals/components/GoalsCard";
import { getGoals } from "@/src/features/goals/queries";
import { getWeightUnit } from "@/src/features/profile/queries";

export default async function Routines() {
  const [response, deloadResponse, goalsResponse, unit] = await Promise.all([
    getAllRoutines(),
    getDeloadAssessment(),
    getGoals(),
    getWeightUnit(),
  ]);
  const routines = response.success ? response.data : [];

  return (
    <div className="container flex flex-col gap-4">
      <h2 className="text-2xl">Routines</h2>
      {deloadResponse.success && (
        <DeloadBanner assessment={deloadResponse.data} />
      )}
      {goalsResponse.success && (
        <GoalsCard goals={goalsResponse.data} unit={unit} />
      )}
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
      <StartEmptyWorkoutButton />

      <CreateRoutineLink />
      <StoredWorkout />
      <NotificationsPrompt />
    </div>
  );
}
