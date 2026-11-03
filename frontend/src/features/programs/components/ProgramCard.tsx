"use client";
import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import { getDayStr } from "@/src/features/routines/utils";
import { Program } from "../types";
import ApplyProgramDialog from "./ApplyProgramDialog";

export default function ProgramCard({ program }: { program: Program }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">{program.name}</h3>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">
            {program.level}
          </span>
        </div>
        <p className="mt-1 text-sm text-secondary-foreground">
          {program.description}
        </p>
        <p className="mt-1 text-sm text-secondary-foreground">
          {program.days.length} days a week
        </p>
      </div>

      <Accordion type="single" collapsible>
        {program.days.map((day, index) => (
          <AccordionItem key={`${day.name}-${index}`} value={String(index)}>
            <AccordionTrigger>
              {day.name}
              <span className="ml-auto mr-2 text-xs text-secondary-foreground">
                {getDayStr(day.offset)}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-col gap-1 text-sm">
                {day.exercises.map((exercise) => (
                  <li
                    key={exercise.name}
                    className="flex justify-between gap-2"
                  >
                    <span className="capitalize">{exercise.name}</span>
                    <span className="text-secondary-foreground">
                      {exercise.sets} × {exercise.reps}
                    </span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Button onClick={() => setIsDialogOpen(true)}>Add to my routines</Button>
      <ApplyProgramDialog
        program={program}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
