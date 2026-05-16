import { routinesApi } from "@/src/features/routines/api";
import RoutineCard from "./components/RoutineCard";

export default async function Routines() {
  const routines = await routinesApi.getAll();

  return (
    <div className="container">
      <h2>Routines</h2>
      <div className="flex flex-col gap-4 mt-4">
        {routines.map((routine) => (
          <RoutineCard key={routine.id} routine={routine} />
        ))}
      </div>
    </div>
  );
}
