import React from "react";
import WorkoutsCalendar from "../components/WorkoutCalendar";
import { getWorkouts } from "@/src/features/workout/queries";

export default async function WorkoutCalendarPage() {
  const response = await getWorkouts();
  const workouts = response.success ? response.data : [];
  return <WorkoutsCalendar workouts={workouts} />;
}
