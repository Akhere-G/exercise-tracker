"use client";

import { useState } from "react";
import Link from "next/link";
import { Workout } from "@/src/features/workout/types";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Dot,
} from "lucide-react";

export default function WorkoutsCalendar({
  workouts,
}: {
  workouts: Workout[];
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calendar calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Adjusting Sunday (0) to 6, Monday (1) to 0 for a British/European standard Monday-start calendar
  const blankDaysCount = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: blankDaysCount }, (_, i) => i);

  // Group workouts by date string (YYYY-MM-DD) for O(1) calendar cell lookup
  const workoutsByDate = workouts.reduce<Record<string, Workout[]>>(
    (acc, workout) => {
      if (!workout.completedAt) return acc;
      const dateKey = new Date(workout.completedAt).toISOString().split("T")[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(workout);
      return acc;
    },
    {},
  );

  console.log(workouts);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="">
      <div className="flex items-center justify-between mb-6">
        <div className="container flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">
            {monthNames[month]} {year}
          </h1>
        </div>
        <div className="flex items-center gap-2 border border-border rounded-xl p-1 bg-card">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mx-1 mb-4 border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-border bg-muted/30 text-center py-3">
          {weekDays.map((day) => (
            <span
              key={day}
              className="text-xs font-semibold text-muted-foreground"
            >
              {day}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-[100px] md:auto-rows-[120px]">
          {blanksArray.map((blank) => (
            <div
              key={`blank-${blank}`}
              className="border-b border-r border-border/60 bg-muted/10 last:border-r-0"
            />
          ))}

          {daysArray.map((day) => {
            const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayWorkouts = workoutsByDate[dateString] || [];
            const isToday =
              new Date().toDateString() ===
              new Date(year, month, day).toDateString();

            return (
              <div
                key={day}
                className="border-b border-r border-border/60 p-2 flex flex-col justify-between overflow-hidden relative group last:border-r-0"
              >
                <span
                  className={`text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full self-start ${
                    isToday
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-foreground"
                  }`}
                >
                  {day}
                </span>

                <div className="w-full items-center justify-center gap-1 overflow-y-auto no-scrollbar max-h-17.5">
                  {dayWorkouts.map((workout, index) => (
                    <Link
                      key={workout.id || index}
                      href={`/workouts/summary/${workout.id}`}
                    >
                      <div className="w-full flex-1 h-2 bg-primary rounded-full mt-2" />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
