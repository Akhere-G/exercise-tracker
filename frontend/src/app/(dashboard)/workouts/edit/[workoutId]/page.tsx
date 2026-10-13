import { getWorkout } from "@/src/features/workout/queries";
import { updateWorkout } from "@/src/features/workout/actions";
import WorkoutForm from "../../components/WorkoutForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/card";

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;
  const id = Number(workoutId);

  const response = await getWorkout(id);
  const workout = response.success ? response.data : null;

  if (!workout) {
    return (
      <div className="container">
        <h2>Workout not found</h2>
      </div>
    );
  }

  return (
    <div className="container relative">
      <Card>
        <CardHeader>
          <CardTitle className="title mb-2">Edit Workout</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkoutForm
            initialData={workout}
            submitAction={async (data) => {
              "use server";
              return await updateWorkout(id, data);
            }}
            submitText="Save Changes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
