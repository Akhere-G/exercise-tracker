import { getWorkout, getWorkoutStats } from "@/src/features/workout/queries";
import {
  getGreyShadeCSS,
  getOrdinalSuffix,
  getTime,
  getTotalVolume,
  mapToTargetMuscle,
} from "@/src/features/workout/utils";
import { Flame, Timer, Weight } from "lucide-react";
import { ExtendedBodyPart, Slug } from "react-muscle-highlighter";
import BodyChart from "./components/BodyChart";
import { Exercise } from "@/src/features/workout/store";
import ConffettiEffect from "./components/ConffettiEffect";
import ExerciseStat from "../../../components/ExerciseStat";
import ExerciseCard from "../../../components/ExerciseCard";

export default async function WorkoutSummary({
  params,
  searchParams,
}: {
  params: Promise<{ workoutId: string }>;
  searchParams: Promise<{ first: string }>;
}) {
  const { workoutId } = await params;
  const { first } = await searchParams;

  const response = await getWorkout(Number(workoutId));
  const workout = response.success ? response.data : null;

  const muscles: Record<string, number> = {};
  const exercises: Record<number, Exercise> = {};

  const statsResponse = await getWorkoutStats(workout?.routineId);
  const stats = statsResponse.success ? statsResponse.data : null;

  workout?.sets.forEach((s) => {
    s.exercise.muscles.forEach((m) => {
      const contribution = m.contributionType === "primary" ? 2 : 1;
      const name = mapToTargetMuscle(m.name);
      if (name) {
        muscles[name] = (muscles[name] ?? 0) + contribution;
      }
    });

    if (!exercises[s.exerciseId]) {
      exercises[s.exerciseId] = { ...s.exercise, sets: [] };
    }
    exercises[s.exerciseId].sets.push(s);
  });

  const data: ExtendedBodyPart[] = Object.entries(muscles).map(
    ([slug, intensity]) => ({
      slug: slug.toLowerCase() as Slug,
      intensity,
      color: getGreyShadeCSS(intensity),
    }),
  );

  const exercisesList = Object.values(exercises);

  return (
    <div className="flex justify-center w-screen">
      <div className="container">
        <h2 className="text-2xl">Workout Complete</h2>
        <span className="text-center block w-full text-2xl p-16">
          {stats?.workoutCount}
          {getOrdinalSuffix(stats?.workoutCount ?? -1)} workout
        </span>

        <div className="flex gap-4">
          <ExerciseStat
            Icon={Weight}
            title={getTotalVolume(exercisesList) + " kg"}
            subtitle="Volume"
          />
          <ExerciseStat
            Icon={Timer}
            title={getTime(workout?.duration ?? 0)}
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
        <h2 className="text-2xl">Exercises</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.values(exercises).map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </div>
        {first && <ConffettiEffect />}
      </div>
    </div>
  );
}
