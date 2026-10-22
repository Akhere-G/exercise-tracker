"use client";

import { useEffect } from "react";
import { useWorkout, workoutOwnerKey, workoutStorageKey } from "../store";

// The in-progress workout lives in localStorage, which is shared by everyone
// using this browser. Remember whose it is and throw it away when someone else
// signs in, so they cannot resume (and save) another user's workout.
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
