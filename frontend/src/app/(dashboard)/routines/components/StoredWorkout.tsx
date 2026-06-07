"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/card";
import {
  useWorkout,
  WorkoutState,
  workoutStorageKey,
} from "@/src/features/workout/store";
import { getTime } from "@/src/features/workout/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StoredWorkout() {
  const [routineName, setRoutineName] = useState<string | null>(null);
  const [routineId, setRoutineId] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null,
  );
  const router = useRouter();
  const { setWorkoutData } = useWorkout();
  useEffect(() => {
    function getWorkoutData() {
      try {
        const workoutJson = localStorage.getItem(workoutStorageKey);
        if (!workoutJson) return;
        const workoutData: { state: WorkoutState } = JSON.parse(workoutJson);

        if (workoutData.state.routineName) {
          setRoutineName(workoutData.state.routineName);
        } else {
          setRoutineName("Standalone workout");
        }

        if (workoutData.state.startedAt) {
          const startDate = new Date(workoutData.state.startedAt);
          const duration = Math.floor(
            (new Date().getTime() - startDate.getTime()) / 1000,
          );
          setDuration(duration);

          const interval = setInterval(
            () => setDuration((prev) => (prev !== null ? prev + 1 : null)),
            1000,
          );

          setTimerInterval(interval);
        }

        if (workoutData.state.routineId) {
          setRoutineId(workoutData.state.routineId);
        }

        setWorkoutData(workoutData.state);
      } catch {}
    }

    getWorkoutData();

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, []);

  return (
    routineName && (
      <div className="sticky bottom-12">
        <div
          className=" "
          onClick={() => router.push(`/workouts/active?routineId=${routineId}`)}
        >
          <Card>
            <CardHeader>
              <CardTitle>{routineName}</CardTitle>
              {duration && (
                <CardDescription>{getTime(duration)}</CardDescription>
              )}
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  );
}
