"use client";
import { useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { weekKey } from "../utils";
import { DeloadAssessment } from "../types";

const STORAGE_KEY = "deload-dismissed-week";
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const readDismissedWeek = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const dismiss = () => {
  try {
    localStorage.setItem(STORAGE_KEY, weekKey(new Date()));
  } catch {
    // Dismissal just won't persist.
  }
  listeners.forEach((listener) => listener());
};

export default function DeloadBanner({
  assessment,
}: {
  assessment: DeloadAssessment;
}) {
  // The server snapshot reports the banner as dismissed so it never flashes.
  const dismissedWeek = useSyncExternalStore(subscribe, readDismissedWeek, () =>
    weekKey(new Date()),
  );

  if (!assessment.shouldDeload || dismissedWeek === weekKey(new Date())) {
    return null;
  }

  const { suggestion, stalledExercises, reasons, message } = assessment;
  return (
    <div
      role="status"
      className="relative rounded-lg border bg-card p-4 pr-10 text-sm"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1"
        aria-label="Dismiss"
        onClick={dismiss}
      >
        <X size={16} />
      </Button>
      <p className="font-semibold">Consider a deload week</p>
      {message && <p className="mt-1">{message}</p>}
      <ul className="mt-2 list-disc pl-5 text-secondary-foreground">
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      {stalledExercises.length > 0 && (
        <p className="mt-2 text-secondary-foreground">
          Stalled: {stalledExercises.map((e) => e.name).join(", ")}
        </p>
      )}
      {suggestion && (
        <p className="mt-2">
          Train at about {suggestion.volumePercent}% of your usual volume, with
          the same weights and effort at RPE {suggestion.maxRpe} or lower.
        </p>
      )}
    </div>
  );
}
