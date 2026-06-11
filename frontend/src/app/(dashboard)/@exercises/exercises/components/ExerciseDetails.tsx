"use client";
import { Drawer, DrawerContent } from "@/src/components/ui/drawer";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Exercise } from "@/src/features/exercises/types";
import { Dot } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import ExerciseInstructions from "./ExerciseInstructions";
import ExerciseHistory from "./ExerciseHistory";
import ExerciseStats from "./ExerciseStats";
import { useRouter } from "next/navigation";
import { workoutSetWithDate } from "@/src/features/workout/types";
import { getImageUrl } from "@/src/features/exercises/utils";

export default function ExerciseDetails({
  exercise,
  workoutSets,
}: {
  exercise: Exercise | null;
  workoutSets: workoutSetWithDate[] | null;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();
  return (
    <>
      <Drawer
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          setTimeout(() => router.back(), 500);
        }}
      >
        <DrawerContent className="border-secondary">
          {exercise && workoutSets ? (
            <ExerciseDetail exercise={exercise} workoutSets={workoutSets} />
          ) : (
            <div className="container">
              <p>Not Found</p>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}

function ExerciseDetail({
  exercise,
  workoutSets,
}: {
  exercise: Exercise;
  workoutSets: workoutSetWithDate[];
}) {
  const { videoUrl, name, equipment, muscles, metrics } = exercise;

  const groupedSets = workoutSets.reduce(
    (acc, set) => {
      const dateKey = new Date(set.completedAt).toDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(set);
      return acc;
    },
    {} as Record<string, typeof workoutSets>,
  );

  const tabClasses = `data-[state=active]:text-primary data-[state=active]:border-primary hover:text-primary!  bg-transparent! border-0 border-b-2 rounded-none
    transition-colors duration-500`;

  return (
    <div className=" px-4">
      <div className="relative h-30 bg-white rounded-2xl mx-2">
        <Image
          src={getImageUrl(videoUrl)}
          alt={exercise.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-scale-down"
        />
      </div>

      <div className="container">
        <h2 className="text-2xl">{name}</h2>
        <div className="flex justify-between">
          <p className="flex items-center text-muted-foreground capitalize ">
            <span>{equipment}</span>
            <Dot className="w-3 h-3 opacity-60 shrink-0" />
            <span className="truncate">
              {muscles.map((m) => m.name).join(", ")}
            </span>
          </p>
          <p className="flex items-center text-muted-foreground capitalize ">
            {metrics}
          </p>
        </div>

        <Tabs defaultValue="details">
          <TabsList className="-translate-x-1 bg-transparent mx-0">
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
          <div className="no-scrollbar overflow-y-auto max-h-[40vh]">
            <TabsContent value="details">
              <ExerciseInstructions exercise={exercise} />
            </TabsContent>
            <TabsContent value="history">
              <ExerciseHistory exercise={exercise} groupedSets={groupedSets} />
            </TabsContent>
            <TabsContent value="stats">
              <ExerciseStats exercise={exercise} groupedSets={groupedSets} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
