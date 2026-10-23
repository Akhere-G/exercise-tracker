import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { benchPress, makeRoutine, pushUp } from "@/tests/factories";

const push = vi.hoisted(() => vi.fn());
const toast = vi.hoisted(() => Object.assign(vi.fn(), { error: vi.fn() }));
const createWorkout = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  redirect: vi.fn(),
}));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/src/features/workout/actions", () => ({
  createWorkout,
  getPreviousSets: vi.fn(async () => ({ success: true, data: [] })),
}));
vi.mock("@/src/features/exercises/actions", () => ({
  getAllExercises: vi.fn(async () => ({ success: true, data: [] })),
}));

import WorkoutClientProvider from "@/src/app/(dashboard)/workouts/active/components/WorkoutClientProvider";
import { useWorkout, workoutStorageKey } from "@/src/features/workout/store";
import { useTimer } from "@/src/features/timer/store";

const initialState = useWorkout.getState();

function storedState() {
  const raw = localStorage.getItem(workoutStorageKey);
  return raw ? JSON.parse(raw).state : null;
}

/** Simulates closing the tab and reopening it: in-memory store is lost, storage survives. */
async function refreshBrowser() {
  const saved = localStorage.getItem(workoutStorageKey);
  useWorkout.setState({ ...initialState }, true);
  if (saved === null) localStorage.removeItem(workoutStorageKey);
  else localStorage.setItem(workoutStorageKey, saved);
  await useWorkout.persist.rehydrate();
}

async function completeFirstSet(user: ReturnType<typeof userEvent.setup>) {
  const [, firstSet] = screen.getAllByRole("row");
  const buttons = within(firstSet).getAllByRole("button");
  await user.click(buttons[buttons.length - 1]);
}

beforeEach(() => {
  useWorkout.setState({ ...initialState }, true);
  useTimer.getState().clear();
  localStorage.clear();
  push.mockClear();
  toast.mockClear();
  toast.error.mockClear();
  createWorkout.mockReset();
});

describe("starting a workout from a routine", () => {
  it("seeds every routine exercise with default sets and saves the session locally", async () => {
    render(<WorkoutClientProvider routine={makeRoutine()} />);

    await waitFor(() => expect(useWorkout.getState().exercises).toHaveLength(2));

    const saved = storedState();
    expect(saved.routineId).toBe(7);
    expect(saved.routineName).toBe("Push day");
    expect(saved.currentExerciseId).toBe(benchPress.id);
    expect(saved.startedAt).toEqual(expect.any(String));
    expect(saved.exercises.map((e: { id: number }) => e.id)).toEqual([benchPress.id, pushUp.id]);
    expect(saved.exercises[0].sets).toHaveLength(3);
    expect(screen.getByText("Bench Press")).toBeInTheDocument();
  });
});

describe("logging sets", () => {
  it("persists edited values as numbers and the completed flag after every change", async () => {
    const user = userEvent.setup({ delay: null });
    render(<WorkoutClientProvider routine={makeRoutine()} />);
    await waitFor(() => expect(useWorkout.getState().exercises).toHaveLength(2));

    const [, firstSet] = screen.getAllByRole("row");
    const [weight, reps] = within(firstSet).getAllByRole("spinbutton");
    await user.click(weight);
    await user.type(weight, "62.5");
    await user.tab();
    await user.click(reps);
    await user.type(reps, "8");
    await user.tab();
    await completeFirstSet(user);

    const set = storedState().exercises[0].sets[0];
    expect(set).toMatchObject({ weight: 62.5, reps: 8, isCompleted: true });
    expect(typeof set.weight).toBe("number");
    expect(typeof set.reps).toBe("number");
  });

  it("refuses to complete a set with no reps", async () => {
    const user = userEvent.setup({ delay: null });
    render(<WorkoutClientProvider routine={makeRoutine()} />);
    await waitFor(() => expect(useWorkout.getState().exercises).toHaveLength(2));
    useWorkout.getState().setWorkoutData({
      exercises: useWorkout.getState().exercises.map((e) => ({
        ...e,
        sets: e.sets.map((s) => ({ ...s, reps: 0 })),
      })),
    });

    await completeFirstSet(user);

    expect(toast.error).toHaveBeenCalledWith("Cannot complete set with reps less than 1.");
    expect(storedState().exercises[0].sets[0].isCompleted).toBe(false);
  });
});

describe("recovering a session after refresh or browser close", () => {
  it("restores progress instead of reseeding from the routine", async () => {
    const user = userEvent.setup({ delay: null });
    const first = render(<WorkoutClientProvider routine={makeRoutine()} />);
    await waitFor(() => expect(useWorkout.getState().exercises).toHaveLength(2));
    await completeFirstSet(user);
    const startedAt = storedState().startedAt;
    first.unmount();

    await refreshBrowser();
    expect(useWorkout.getState().exercises[0].sets[0].isCompleted).toBe(true);
    render(<WorkoutClientProvider routine={makeRoutine({ name: "Renamed" })} />);

    await waitFor(() => expect(screen.getAllByRole("row").length).toBeGreaterThan(1));
    const state = useWorkout.getState();
    expect(state.routineName).toBe("Push day");
    expect(state.exercises[0].sets[0].isCompleted).toBe(true);
    expect(new Date(state.startedAt!).toISOString()).toBe(new Date(startedAt).toISOString());
  });

  it("recovers an ad-hoc session even when no routine can be loaded", async () => {
    localStorage.setItem(
      workoutStorageKey,
      JSON.stringify({
        version: 0,
        state: {
          routineId: null,
          routineName: null,
          startedAt: "2025-01-06T10:00:00.000Z",
          duration: null,
          currentExerciseId: pushUp.id,
          exercises: [
            {
              ...pushUp,
              sets: [{ exerciseId: pushUp.id, setIndex: 1, reps: 12, isCompleted: true }],
            },
          ],
        },
      }),
    );
    await useWorkout.persist.rehydrate();

    render(<WorkoutClientProvider routine={null} />);

    await waitFor(() => expect(screen.getByText("Push Up")).toBeInTheDocument());
    expect(useWorkout.getState().exercises[0].sets[0].reps).toBe(12);
  });

  it.each([
    ["invalid JSON", "{not json"],
    ["JSON null", "null"],
    ["a bare string", '"oops"'],
    ["no state", "{}"],
    ["state without exercises", JSON.stringify({ state: { routineName: "x" }, version: 0 })],
    ["exercises of the wrong type", JSON.stringify({ state: { exercises: "oops" }, version: 0 })],
    ["exercises without sets", JSON.stringify({ state: { exercises: [{ id: 1 }] }, version: 0 })],
  ])("falls back to the routine when stored data is %s", async (_label, raw) => {
    localStorage.setItem(workoutStorageKey, raw);
    await useWorkout.persist.rehydrate();

    render(<WorkoutClientProvider routine={makeRoutine()} />);

    await waitFor(() => expect(useWorkout.getState().exercises).toHaveLength(2));
    expect(screen.getByText("Bench Press")).toBeInTheDocument();
    expect(useWorkout.getState().routineName).toBe("Push day");
  });
});

describe("completing a workout", () => {
  async function startAndCompleteOneSet(user: ReturnType<typeof userEvent.setup>) {
    render(<WorkoutClientProvider routine={makeRoutine()} />);
    await waitFor(() => expect(useWorkout.getState().exercises).toHaveLength(2));
    await completeFirstSet(user);
  }

  it("sends only completed sets, then clears the saved session and opens the summary", async () => {
    const user = userEvent.setup({ delay: null });
    createWorkout.mockResolvedValue({ success: true, data: { id: 41 } });
    await startAndCompleteOneSet(user);

    await user.click(screen.getByRole("button", { name: "Complete Workout" }));

    expect(createWorkout).toHaveBeenCalledTimes(1);
    const payload = createWorkout.mock.calls[0][0];
    expect(payload.routineId).toBe(7);
    expect(payload.sets).toHaveLength(1);
    expect(payload.sets[0]).toMatchObject({ exerciseId: benchPress.id, setIndex: 1, isCompleted: true });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/workouts/summary/41?first=true"));
    expect(localStorage.getItem(workoutStorageKey)).toBeNull();
    expect(useWorkout.getState().exercises).toEqual([]);
  });

  it("submits once when the button is pressed repeatedly", async () => {
    const user = userEvent.setup({ delay: null });
    let resolve!: (value: unknown) => void;
    createWorkout.mockReturnValue(new Promise((r) => (resolve = r)));
    await startAndCompleteOneSet(user);
    const button = screen.getByRole("button", { name: "Complete Workout" });

    await user.click(button);
    await user.click(button);
    await user.click(button);
    await act(async () => resolve({ success: true, data: { id: 5 } }));

    expect(createWorkout).toHaveBeenCalledTimes(1);
  });

  it("keeps the session and lets the user retry when the server rejects the save", async () => {
    const user = userEvent.setup({ delay: null });
    createWorkout.mockResolvedValueOnce({ success: false, error: "Server exploded", status: 500 });
    await startAndCompleteOneSet(user);

    await user.click(screen.getByRole("button", { name: "Complete Workout" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Server exploded"));
    expect(push).not.toHaveBeenCalled();
    expect(storedState().exercises[0].sets[0].isCompleted).toBe(true);
    expect(screen.getByRole("button", { name: "Complete Workout" })).toBeEnabled();

    createWorkout.mockResolvedValueOnce({ success: true, data: { id: 8 } });
    await user.click(screen.getByRole("button", { name: "Complete Workout" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/workouts/summary/8?first=true"));
    expect(createWorkout).toHaveBeenCalledTimes(2);
  });

  it("keeps the session when the network request throws", async () => {
    const user = userEvent.setup({ delay: null });
    createWorkout.mockRejectedValueOnce(new Error("offline"));
    await startAndCompleteOneSet(user);

    await user.click(screen.getByRole("button", { name: "Complete Workout" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Could not save workout."));
    expect(push).not.toHaveBeenCalled();
    expect(localStorage.getItem(workoutStorageKey)).not.toBeNull();
    expect(screen.getByRole("button", { name: "Complete Workout" })).toBeEnabled();
  });

  it("records a realistic duration for a session that never recorded a start time", async () => {
    const user = userEvent.setup({ delay: null });
    createWorkout.mockResolvedValue({ success: true, data: { id: 3 } });
    localStorage.setItem(
      workoutStorageKey,
      JSON.stringify({
        version: 0,
        state: {
          routineId: null,
          routineName: null,
          startedAt: null,
          duration: null,
          currentExerciseId: pushUp.id,
          exercises: [
            {
              ...pushUp,
              sets: [{ exerciseId: pushUp.id, setIndex: 1, reps: 12, isCompleted: true }],
            },
          ],
        },
      }),
    );
    await useWorkout.persist.rehydrate();
    render(<WorkoutClientProvider routine={null} />);
    await waitFor(() => expect(screen.getByText("Push Up")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Complete Workout" }));

    const { duration } = createWorkout.mock.calls[0][0];
    expect(duration).toBeGreaterThanOrEqual(0);
    expect(duration).toBeLessThan(60);
  });
});
