"use client";
import { Button } from "@/src/components/ui/button";
import { useTimer } from "@/src/features/timer/store";
import { startTimer, cancelTimer, modifyTimer } from "@/src/features/timers/actions";
import { Pause, Play, RefreshCcw } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

export default function RestTimeTracker() {
  const { currentTime, isRunning, start, pause, play, setTime, clear, restTime } =
    useTimer();

  const mins =
    currentTime < 0
      ? "-" + Math.abs(Math.ceil(currentTime / 60))
      : Math.floor(currentTime / 60);
  const secs = Math.abs(currentTime % 60)
    .toString()
    .padStart(2, "0");

  const Icon = isRunning ? Pause : Play;

  function playSound() {
    const audio = new Audio("/alert.wav");
    audio.play();
  }
  useEffect(() => {
    if (currentTime === 0 && isRunning) {
      toast("Rest complete!");
      playSound();
    }
  }, [currentTime, isRunning]);

  const handleStart = () => {
    start();
    startTimer(restTime);
  };

  const handlePause = () => {
    pause();
    cancelTimer();
  };

  const handlePlay = () => {
    play();
    startTimer(currentTime > 0 ? currentTime : restTime);
  };

  const handleClear = () => {
    clear();
    cancelTimer();
  };

  const handleDecreaseTime = () => {
    const newTime = currentTime - 15;
    setTime(newTime);
    modifyTimer(newTime > 0 ? newTime : 10);
  };

  const handleIncreaseTime = () => {
    const newTime = currentTime + 15;
    setTime(newTime);
    modifyTimer(newTime);
  };

  return (
    <div className="relative bottom-0 pt-4 flex flex-col">
      <progress className="progress-bar" value={currentTime} max={restTime}>
        {currentTime / restTime}%
      </progress>
      <div className="flex gap-4 items-center justify-between p-2 bg-secondary ">
        <p className="text-lg flex-1 text-center   ">
          {mins}:{secs}
        </p>
        <Button onClick={handleDecreaseTime}>- 15</Button>
        <Button onClick={() => (isRunning ? handlePause() : handlePlay())}>
          <Icon />
        </Button>
        <Button onClick={handleIncreaseTime}>+ 15</Button>
        <Button onClick={handleClear}>
          <RefreshCcw />
        </Button>
      </div>
    </div>
  );
}
