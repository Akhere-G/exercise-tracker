import { getRoutineById } from "@/src/features/routines/queries";
import { getDayStr } from "@/src/features/routines/utils";
import { getWorkouts, getWorkoutStats } from "@/src/features/workout/queries";
import { Dot, Flame, Timer, Weight } from "lucide-react";
import ExerciseStat from "../../components/ExerciseStat";
import {
  getTotalTime,
  getTotalWorkoutsVolume,
} from "@/src/features/workout/utils";
import BodyChart from "../../workouts/summary/[workoutId]/components/BodyChart";
import { getMuscleMapData } from "@/src/features/exercises/utils";
import RoutineItemCard from "../../components/RoutineItemCard";

export default async function RoutineDetails({
  params,
}: {
  params: Promise<{ routineId: number }>;
}) {
  const { routineId } = await params;

  const routineReponse = await getRoutineById(Number(routineId));
  const routine = routineReponse.success ? routineReponse.data : null;
  const repsonse = await getWorkouts(routineId);

  const workouts = repsonse.success ? repsonse.data : [];

  const statsResponse = await getWorkoutStats(routineId);

  const stats = statsResponse.success ? statsResponse.data : null;

  const exercises = routine?.routineItems.map((r) => r.exercise) ?? [];

  const data = getMuscleMapData(exercises);

  if (!routine) {
    return (
      <div className="container">
        <h2>Routine not found</h2>
      </div>
    );
  }
  return (
    <div className="container">
      <h2>{routine.name}</h2>
      <p className="flex gap-0 items-center text-sm text-muted-foreground">
        {getDayStr(routine.day)} <Dot size={20} />
        {routine.startTime?.substring(0, 5)}
      </p>

      <p className="text-2xl text-center py-8">{workouts.length} Workouts</p>

      <div className="flex flex-wrap gap-4">
        <ExerciseStat
          Icon={Weight}
          title={getTotalWorkoutsVolume(workouts) + " kg"}
          subtitle="Volume"
        />
        <ExerciseStat
          Icon={Timer}
          title={getTotalTime(workouts)}
          subtitle="Minutes"
        />
        <ExerciseStat
          Icon={Flame}
          title={stats?.weeklyStreak ?? "0"}
          subtitle="Streak"
        />
      </div>

      <div className="flex justify-center ">
        <BodyChart data={data} side="front" />
        <BodyChart data={data} side="back" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {routine.routineItems.map((routineItem) => (
          <RoutineItemCard
            key={routineItem.exerciseId}
            routineItem={routineItem}
          />
        ))}
      </div>
    </div>
  );
}
