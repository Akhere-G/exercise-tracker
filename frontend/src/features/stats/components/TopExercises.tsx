import Link from "next/link";
import { Card, CardContent } from "@/src/components/card";
import { TopExercise } from "../types";

export default function TopExercises({ exercises }: { exercises: TopExercise[] }) {
  if (exercises.length === 0) return null;

  return (
    <section>
      <h3 className="text-xl mb-4">Top exercises</h3>
      <div className="flex flex-col gap-2">
        {exercises.map((exercise, index) => (
          <Card key={exercise.id}>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Link
                  href={`/exercises/${exercise.id}`}
                  className="block truncate"
                >
                  {index + 1}. {exercise.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {exercise.workoutCount}{" "}
                  {exercise.workoutCount === 1 ? "workout" : "workouts"}
                </p>
              </div>
              <p className="text-nowrap">
                {exercise.setCount} {exercise.setCount === 1 ? "set" : "sets"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
