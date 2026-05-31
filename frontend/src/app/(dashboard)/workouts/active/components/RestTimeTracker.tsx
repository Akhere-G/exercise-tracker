import { Button } from "@/src/components/ui/button";
import { useTimer } from "@/src/features/timer/store";
import { Pause, Play, RefreshCcw } from "lucide-react";

export default function RestTimeTracker() {
  const { currentTime, isRunning, start, pause, play, setTime, restTime } =
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
    <div className="relative bottom-0 pt-4 flex flex-col">
      <progress className="progress-bar" value={currentTime} max={restTime}>
        {currentTime / restTime}%
      </progress>
      <div className="flex gap-2 items-center justify-between p-2 bg-secondary ">
        <p className="text-lg flex-1 text-center   ">
          {mins}:{secs}
        </p>
        <Button onClick={() => setTime(currentTime - 15)}>- 15</Button>
        <Button onClick={() => (isRunning ? pause() : play())}>
          <Icon />
        </Button>
        <Button onClick={() => setTime(currentTime + 15)}>+ 15</Button>
        <Button onClick={start}>
          <RefreshCcw />
        </Button>
      </div>
    </div>
  );
}
