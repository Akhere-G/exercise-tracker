import { editRoutine, getRoutineById } from "@/src/features/routines/api";

import RoutineForm from "../../components/RoutineForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/card";
import { Routine } from "@/src/features/routines/types";

export default async function EditRoutinePage({
  params,
}: {
  params: Promise<{ routineId: string }>;
}) {
  const { routineId } = await params;

  const response = await getRoutineById(Number(routineId));
  const routine = response.success ? response.data : null;

  if (!routine) {
    return (
      <div className="container">
        <h2>Routine not found</h2>
      </div>
    );
  }

  const formattedRoutine: Routine = {
    ...routine,
    routineItems: routine.routineItems.map((r) => ({
      ...r,
      targetDuration: r.targetDurationSecs ? r.targetDurationSecs / 60 : null,
    })),
  };

  return (
    <div className="container relative">
      <Card>
        <CardHeader>
          <CardTitle className="title mb-2">Edit Routine</CardTitle>
        </CardHeader>
        <CardContent>
          <RoutineForm
            initalData={formattedRoutine}
            submitAction={async (data) => {
              "use server";
              return await editRoutine(data, Number(routineId));
            }}
            sumbitText="Edit"
          />
        </CardContent>
      </Card>
    </div>
  );
}
