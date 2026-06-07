import { getRoutineById } from "@/src/features/routines/queries";
import { getWorkouts, getWorkoutStats } from "@/src/features/workout/queries";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import RoutineDetails from "./components/RoutineDetails";
import RoutineStats from "./components/RoutineStats";
import RoutineHistory from "./components/RoutineHistory";
import { getDayStr } from "@/src/features/routines/utils";
import { Dot } from "lucide-react";

export default async function RoutineData({
  params,
}: {
  params: Promise<{ routineId: string }>;
}) {
  const routineId = Number((await params).routineId);

  const routineReponse = await getRoutineById(routineId);
  const routine = routineReponse.success ? routineReponse.data : null;
  const repsonse = await getWorkouts(routineId);

  const workouts = repsonse.success ? repsonse.data : [];

  const statsResponse = await getWorkoutStats(routineId);

  const stats = statsResponse.success ? statsResponse.data : null;

  const tabClasses = `data-[state=active]:text-primary data-[state=active]:border-primary hover:text-primary!  bg-transparent! border-0 border-b-2 rounded-none
    transition-colors duration-500`;
  if (!routine || !stats) {
    return (
      <div className="container">
        <h2>Routine not found</h2>
      </div>
    );
  }
  return (
    <div>
      <div className="container">
        <h2 className="text-2xl">{routine.name}</h2>
        <p className=" flex gap-0 items-center text-sm text-muted-foreground">
          {getDayStr(routine.day)} <Dot size={20} />
          {routine.startTime?.substring(0, 5)}
        </p>
      </div>
      <Tabs defaultValue="details">
        <div className="container py-0 px-3">
          <TabsList className="container bg-transparent mx-0">
            <TabsTrigger value="details" className={tabClasses}>
              Details
            </TabsTrigger>
            <TabsTrigger value="history" className={tabClasses}>
              History
            </TabsTrigger>
            <TabsTrigger value="stats" className={tabClasses}>
              Stats
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="details">
          <RoutineDetails routine={routine} workouts={workouts} stats={stats} />
        </TabsContent>
        <TabsContent value="history">
          <RoutineHistory routine={routine} workouts={workouts} stats={stats} />
        </TabsContent>
        <TabsContent value="stats">
          <RoutineStats routine={routine} workouts={workouts} stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
