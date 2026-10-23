import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { benchPress, makeActiveExercise } from "@/tests/factories";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import StoredWorkout from "@/src/app/(dashboard)/routines/components/StoredWorkout";
import { WorkoutOwnerGuard } from "@/src/features/workout/components/WorkoutOwnerGuard";
import { useWorkout, workoutOwnerKey, workoutStorageKey } from "@/src/features/workout/store";

const initialState = useWorkout.getState();

function saveSession(overrides: Record<string, unknown> = {}) {
  localStorage.setItem(
    workoutStorageKey,
    JSON.stringify({
      version: 0,
      state: {
        routineId: 7,
        routineName: "Push day",
        startedAt: new Date(Date.now() - 125_000).toISOString(),
        duration: null,
        currentExerciseId: benchPress.id,
        exercises: [makeActiveExercise(benchPress, [])],
        ...overrides,
      },
    }),
  );
}

beforeEach(() => {
  useWorkout.setState({ ...initialState }, true);
  localStorage.clear();
});

afterEach(() => vi.useRealTimers());

describe("StoredWorkout resume card", () => {
  it("offers to resume a saved session with its name and elapsed time", async () => {
    saveSession();

    render(<StoredWorkout />);

    expect(await screen.findByText("Push day")).toBeInTheDocument();
    expect(screen.getByText("02:05")).toBeInTheDocument();
  });

  it("labels a session that has no routine", async () => {
    saveSession({ routineId: null, routineName: null });

    render(<StoredWorkout />);

    expect(await screen.findByText("Standalone workout")).toBeInTheDocument();
  });

  it("shows nothing when there is no saved session", async () => {
    render(<StoredWorkout />);

    await waitFor(() => expect(screen.queryByText("Push day")).not.toBeInTheDocument());
    expect(document.body.textContent).toBe("");
  });

  it.each(["{broken", JSON.stringify({ state: { exercises: "x" } }), "null"])(
    "does not crash on corrupt saved data %s",
    (raw) => {
      localStorage.setItem(workoutStorageKey, raw);

      expect(() => render(<StoredWorkout />)).not.toThrow();
      expect(document.body.textContent).toBe("");
    },
  );
});

describe("WorkoutOwnerGuard", () => {
  it("discards a session that belongs to a different user", () => {
    saveSession();
    localStorage.setItem(workoutOwnerKey, "user-a");
    useWorkout.setState({ routineName: "Push day", exercises: [makeActiveExercise(benchPress, [])] });

    render(<WorkoutOwnerGuard ownerId="user-b" />);

    expect(localStorage.getItem(workoutStorageKey)).toBeNull();
    expect(useWorkout.getState().exercises).toEqual([]);
    expect(localStorage.getItem(workoutOwnerKey)).toBe("user-b");
  });

  it("keeps the session for the same user", () => {
    saveSession();
    localStorage.setItem(workoutOwnerKey, "user-a");

    render(<WorkoutOwnerGuard ownerId="user-a" />);

    expect(localStorage.getItem(workoutStorageKey)).not.toBeNull();
  });

  it("claims the session for the first user without discarding it", () => {
    saveSession();

    render(<WorkoutOwnerGuard ownerId="user-a" />);

    expect(localStorage.getItem(workoutStorageKey)).not.toBeNull();
    expect(localStorage.getItem(workoutOwnerKey)).toBe("user-a");
  });

  it("does nothing when signed out", () => {
    saveSession();
    localStorage.setItem(workoutOwnerKey, "user-a");

    render(<WorkoutOwnerGuard ownerId={null} />);

    expect(localStorage.getItem(workoutStorageKey)).not.toBeNull();
    expect(localStorage.getItem(workoutOwnerKey)).toBe("user-a");
  });
});
