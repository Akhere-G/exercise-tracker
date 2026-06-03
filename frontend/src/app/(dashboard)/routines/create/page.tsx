import { createRoutine } from "@/src/features/routines/actions";

import RoutineForm from "../components/RoutineForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/card";

// TODO: Redirect on succesful creation
// TODO: Show server errors

export default async function CreateRoutinePage() {
  return (
    <div className="container relative">
      <Card>
        <CardHeader>
          <CardTitle className="title mb-2">Create Routine</CardTitle>
        </CardHeader>
        <CardContent>
          <RoutineForm submitAction={createRoutine} sumbitText="Create" />
        </CardContent>
      </Card>
    </div>
  );
}
