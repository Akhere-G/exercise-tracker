"use client";
import { Button } from "@/src/components/ui/button";
import { useWorkout } from "@/src/features/workout/store";
import { useRouter } from "next/navigation";
import StartWorkoutDialog from "../routines/components/StartWorkoutDialog";
import { useState } from "react";

export default function StartEmptyWorkoutButton() {
  const [isWorkoutDialogOpen, setIsWorkoutDialogOpen] = useState(false);
  const { routineId, startedAt, resetState } = useWorkout();
  const router = useRouter();

  const handleClick = () => {
    if (!startedAt) {
      resetState();
      router.push("/workouts/active");
    } else {
      setIsWorkoutDialogOpen(true);
    }
  };
  return (
    <>
      <Button variant="ghost" onClick={handleClick}>
        Start Empty Workout
      </Button>
      <StartWorkoutDialog
        isOpen={isWorkoutDialogOpen}
        setIsOpen={setIsWorkoutDialogOpen}
        routineId={Number(routineId)}
      />
    </>
  );
}
