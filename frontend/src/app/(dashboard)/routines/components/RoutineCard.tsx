import { Card } from "@/src/components/card";
import { Routine } from "@/src/features/routines/types";
import { MoreVertical } from "lucide-react";
import React from "react";

export default function RoutineCard({ routine }: { routine: Routine }) {
  const { name, routineItems } = routine;
  console.log(routine);
  return (
    <Card className="p-4">
      <header className="flex items-center gap-2 justify-between w-full">
        <h3>{name}</h3>

        <button>
          <MoreVertical size={16} />
        </button>
      </header>

      <div className=""></div>
    </Card>
  );
}
