import { editRoutine, getRoutineById } from "@/src/features/routines/api";

import RoutineForm from "../../components/RoutineForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/card";

export default async function EditRoutinePage({
  params,
}: {
  params: Promise<{ routineId: string }>;
}) {
  const { routineId } = await params;

  const routine = await getRoutineById(Number(routineId));

  return (
    <div className="container relative">
      <Card>
        <CardHeader>
          <CardTitle className="title mb-2">Edit Routine</CardTitle>
        </CardHeader>
        <CardContent>
          <RoutineForm
            initalData={routine}
            submitAction={async (data) => {
              "use server";
              await editRoutine(data, Number(routineId));
            }}
            sumbitText="Edit"
          />
        </CardContent>
      </Card>
    </div>
  );
}
