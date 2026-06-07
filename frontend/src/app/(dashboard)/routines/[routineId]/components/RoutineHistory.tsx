import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";

import { Routine } from "@/src/features/routines/types";
import { Exercise } from "@/src/features/workout/store";
import { Workout, WorkoutStats } from "@/src/features/workout/types";
import { getSetVolume, getTime } from "@/src/features/workout/utils";
import { Dot, Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function RoutineHistory({
  workouts,
}: {
  routine: Routine;
  workouts: Workout[];
  stats: WorkoutStats;
}) {
  return (
    <div className="container flex flex-col gap-3 py-4 px-3 max-w-5xl mx-auto">
      {workouts.map((workout) => (
        <WorkoutCard key={workout.id} workout={workout} />
      ))}
    </div>
  );
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const { completedAt, duration, sets } = workout;

  const timeStr = getTime(duration);

  const completeDate = new Date(completedAt).toDateString();

  const exerciseMap: Record<number, Exercise> = {};

  sets.forEach((s) => {
    if (!exerciseMap[s.exerciseId]) {
      exerciseMap[s.exerciseId] = { ...s.exercise, sets: [] };
    }
    exerciseMap[s.exerciseId].sets.push(s);
  });

  const exercises = Object.values(exerciseMap);

  return (
    <Card className="border border-border">
      <CardContent className="p-0">
        <Accordion type="single" collapsible defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex w-full justify-between items-center pr-2">
                <Link
                  href={`/workouts/summary/${workout.id}`}
                  className="font-semibold text-secondary-foreground flex gap-2 items-start"
                >
                  {completeDate}
                  <Info size={16} />
                </Link>
                <span className="text-muted-foreground text-xs bg-muted px-2.5 py-0.5  rounded-full border border-border/40">
                  {timeStr}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-0 max-h-min">
              <div className="px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 py-px ">
                  {exercises.map((exercise) => (
                    <ExerciseCard key={exercise.id} exercise={exercise} />
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const { sets, name, equipment, muscles } = exercise;
  return (
    <Card className="border border-border flex flex-col h-full transition-all pt-0">
      <div className="relative w-full h-24 bg-white">
        <Image
          src={`https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/refs/heads/main/${exercise.imageUrl}`}
          alt={exercise.name}
          fill
          className="object-scale-down"
        />
      </div>
      <CardHeader className="px-3 pb-2  gap-0.5 flex-1">
        <CardTitle className="text-sm font-bold  leading-tight">
          {name}
        </CardTitle>
        <CardDescription className="flex items-center flex-wrap text-[11px] text-muted-foreground capitalize gap-0.5">
          <span>{equipment}</span>
          <Dot className="w-3 h-3 opacity-60 shrink-0" />
          <span className="truncate">
            {muscles.map((m) => m.name).join(", ")}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0 flex flex-col gap-1">
        {sets.map((set) => (
          <div
            className="text-[11px] font-semibold text-foreground bg-muted/50 px-2.5 py-1.5 rounded-lg border border-border/40 flex items-center justify-between"
            key={set.setIndex}
          >
            <span className="text-muted-foreground text-[9px] tracking-wider uppercase">
              Set {set.setIndex}
            </span>
            <span>{getSetVolume(exercise, set)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
