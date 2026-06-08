import { Card, CardContent } from "@/src/components/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import { Exercise } from "@/src/features/exercises/types";
import { workoutSetWithDate } from "@/src/features/workout/types";
import { getSetVolume } from "@/src/features/workout/utils";

export default function ExerciseHistory({
  exercise,
  groupedSets,
}: {
  exercise: Exercise;
  groupedSets: Record<string, workoutSetWithDate[]>;
}) {
  const allSets = Object.entries(groupedSets);

  if (allSets.length === 0) {
    return (
      <Card className="m-1">
        <CardContent>
          <h3 className="p-4 text-center">No Data</h3>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      {allSets.map(([date, sets]) => (
        <WorkoutCard key={date} title={date} sets={sets} exercise={exercise} />
      ))}
    </div>
  );
}

function WorkoutCard({
  title,
  sets,
  exercise,
}: {
  title: string;
  sets: workoutSetWithDate[];
  exercise: Exercise;
}) {
  return (
    <Card className="border border-border overflow-hidden">
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="px-4 py-2.5 hover:no-underline text-sm font-semibold">
            {title}
          </AccordionTrigger>
          <AccordionContent className="p-0">
            <div className="px-4 pb-3 pt-0.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-0.5">
                {sets.map((set) => (
                  <SetCard key={set.id} set={set} exercise={exercise} />
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

function SetCard({
  set,
  exercise,
}: {
  set: workoutSetWithDate;
  exercise: Exercise;
}) {
  return (
    <div className="text-[11px] font-semibold text-foreground bg-muted/50 px-2.5 py-1.5 rounded-lg border border-border/40 flex items-center justify-between">
      <span className="text-muted-foreground text-[9px] tracking-wider uppercase">
        Set {set.setIndex}
      </span>
      <span>{getSetVolume(exercise, set)}</span>
    </div>
  );
}
