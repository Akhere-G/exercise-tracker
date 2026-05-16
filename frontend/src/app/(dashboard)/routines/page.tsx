import { routinesApi } from "@/src/features/routines/api";
import RoutineCard from "./components/RoutineCard";

export default async function Routines() {
  const routines = await routinesApi.getAll();

  console.log(routines);
  return (
    <div className="container">
      <h2>Routines</h2>
      {routines.map((routine) => (
        <RoutineCard key={routine.id} routine={routine} />
      ))}
    </div>
  );
}
