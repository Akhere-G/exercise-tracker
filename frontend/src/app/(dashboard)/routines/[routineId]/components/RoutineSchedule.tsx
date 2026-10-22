"use client";

import { getDayStr, toLocalSchedule } from "@/src/features/routines/utils";
import { Dot } from "lucide-react";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

const getSchedule = (day: number, startTime: string | null) => {
  if (!startTime) return `${getDayStr(day)}|`;
  const local = toLocalSchedule(day, startTime);
  return `${getDayStr(local.day)}|${local.time}`;
};

export default function RoutineSchedule({
  day,
  startTime,
}: {
  day: number;
  startTime: string | null;
}) {
  const schedule = useSyncExternalStore(
    subscribe,
    () => getSchedule(day, startTime),
    () => "|",
  );
  const [dayName, time] = schedule.split("|");

  return (
    <>
      {dayName} <Dot size={20} />
      {time}
    </>
  );
}
