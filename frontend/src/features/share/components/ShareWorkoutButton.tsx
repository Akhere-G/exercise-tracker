"use client";
import { useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { track } from "@/src/features/analytics/utils";
import { shareElementAsImage } from "../utils";
import WorkoutShareCard, { WorkoutShareData } from "./WorkoutShareCard";

export default function ShareWorkoutButton({
  data,
}: {
  data: WorkoutShareData;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const share = async () => {
    if (!cardRef.current) return;
    setIsSharing(true);
    try {
      const result = await shareElementAsImage(cardRef.current, {
        filename: "gains-workout.png",
        title: "My workout",
      });
      if (result !== "cancelled") track("share_workout", { method: result });
    } catch {
      toast.error("Could not create the image.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={isSharing}
        onClick={share}
      >
        <Share2 size={14} />
        Share
      </Button>
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 -left-[9999px]"
      >
        <WorkoutShareCard ref={cardRef} data={data} />
      </div>
    </>
  );
}
