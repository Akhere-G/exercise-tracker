"use client";
import { Drawer, DrawerContent, DrawerTitle } from "@/src/components/ui/drawer";
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

export default function ExerciseDetails({
  exercise,
}: {
  exercise: Exercise | null;
}) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div>
      <Drawer open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
        <DrawerTitle>Exercise Details</DrawerTitle>
        <DrawerContent>
          {exercise ? (
            <ExerciseDetail exercise={exercise} />
          ) : (
            <div className="container">
              <p>Not Found</p>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function ExerciseDetail({ exercise }: { exercise: Exercise }) {
  const { videoUrl, name, equipment, muscles } = exercise;

  const tabClasses = `data-[state=active]:text-primary data-[state=active]:border-primary hover:text-primary!  bg-transparent! border-0 border-b-2 rounded-none
    transition-colors duration-500`;

  return (
    <div className="">
      <div className="">
        <div className="relative w-full h-24 bg-white mb-4">
          <Image
            src={`https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/refs/heads/main/${videoUrl}`}
            alt={exercise.name}
            fill
            className="object-scale-down"
          />
        </div>

        <div className="container">
          <h2 className="text-2xl">{name}</h2>
          <p className="flex items-center text-muted-foreground capitalize ">
            <span>{equipment}</span>
            <Dot className="w-3 h-3 opacity-60 shrink-0" />
            <span className="truncate">
              {muscles.map((m) => m.name).join(", ")}
            </span>
          </p>

          <Tabs>
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
            <TabsContent value="details">
              <ExerciseInstructions exercise={exercise} />
            </TabsContent>
            <TabsContent value="history">
              <ExerciseHistory exercise={exercise} />
            </TabsContent>
            <TabsContent value="stats">
              <ExerciseStats exercise={exercise} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
