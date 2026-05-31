import { Button } from "@/src/components/ui/button";
import { Routine } from "@/src/features/routines/types";
import { useTimer } from "@/src/features/timer/store";
import { Pause, Play, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";

export default function RestTimeTracker({
  routine,
}: {
  routine: Routine | null;
}) {
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null,
  );

  const { currentTime, isRunning, start, pause, play, setTime, tick } =
    useTimer();

  const mins =
    currentTime < 0
      ? "-" + Math.abs(Math.ceil(currentTime / 60))
      : Math.floor(currentTime / 60);
  const secs = Math.abs(currentTime % 60)
    .toString()
    .padStart(2, "0");

  const Icon = isRunning ? Pause : Play;

  return (
    <div className="relative bottom-0 pt-4">
      <div className="flex gap-2 items-center justify-between p-2 bg-secondary ">
        <p className="text-lg flex-1 text-center   ">
          {mins}:{secs}
        </p>
        <Button onClick={() => setTime(currentTime - 15)}>- 15</Button>
        <Button onClick={() => (isRunning ? pause() : play())}>
          <Icon />
        </Button>
        <Button onClick={() => setTime(currentTime + 15)}>+ 15</Button>
        <Button
          onClick={() => {
            start();
            if (timerInterval) {
              clearTimeout(timerInterval);
            }
          }}
        >
          <RefreshCcw />
        </Button>
      </div>
    </div>
  );
}
