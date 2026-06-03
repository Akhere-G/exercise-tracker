import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/card";
import { ExerciseImage } from "../workouts/components/ExerciseImage";
import { Dot } from "lucide-react";
import { getVolume } from "@/src/features/workout/utils";
import { Exercise } from "@/src/features/workout/store";

export default function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <Card>
      <CardHeader className="flex gap-2">
        <ExerciseImage exercise={exercise} />
        <div className="">
          <CardTitle>{exercise.name}</CardTitle>
          <CardDescription>
            <p className="flex items-center">
              {exercise.sets.length} sets
              <Dot />
              <span>{getVolume(exercise)}</span>
            </p>
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}
