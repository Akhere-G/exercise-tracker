"use client";

import { useEffect } from "react";
import { useWorkout, workoutOwnerKey, workoutStorageKey } from "../store";

export function WorkoutOwnerGuard({ ownerId }: { ownerId: string | null }) {
  useEffect(() => {
    if (!ownerId) return;

    try {
      const storedOwner = localStorage.getItem(workoutOwnerKey);
      if (storedOwner && storedOwner !== ownerId) {
        useWorkout.getState().resetState();
        localStorage.removeItem(workoutStorageKey);
      }
      localStorage.setItem(workoutOwnerKey, ownerId);
    } catch {}
  }, [ownerId]);

  return null;
}
