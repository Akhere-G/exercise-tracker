// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { stubApi } from "@/tests/apiStub";

vi.mock("next/headers", () => import("@/tests/nextServer"));
vi.mock("next/navigation", () => import("@/tests/navigation"));

import {
  createWorkout,
  getPreviousSetsForExercises,
  updateWorkout,
} from "./actions";

const workout = {
  routineId: 7,
  completedAt: new Date("2026-11-02T10:00:00Z"),
  duration: 3000,
  sets: [{ exerciseId: 1, setIndex: 1, reps: 5, weight: 100 }],
};

describe("workout actions", () => {
  it("posts a finished workout with its duration in seconds", async () => {
    const requests = stubApi(() => ({ status: 201, data: { id: 11 } }));

    expect(await createWorkout(workout)).toEqual({
      success: true,
      data: { id: 11 },
    });
    expect(requests[0]).toMatchObject({
      method: "post",
      url: "/workouts",
      data: {
        duration: 3000,
        completedAt: "2026-11-02T10:00:00.000Z",
        routineId: 7,
      },
    });
  });

  it("converts the edit form's minutes to seconds", async () => {
    const requests = stubApi(() => ({ status: 200, data: { id: 11 } }));
    await updateWorkout(11, { ...workout, duration: 50 });
    expect(requests[0]).toMatchObject({
      method: "patch",
      url: "/workouts/11",
      data: { duration: 3000 },
    });
  });

  it("loads previous sets for several exercises in one request", async () => {
    const requests = stubApi(() => ({ status: 200, data: { 1: [] } }));
    await getPreviousSetsForExercises([1, 2]);
    expect(requests[0]).toMatchObject({
      url: "/workouts/previous",
      params: { exerciseIds: "1,2" },
    });
  });

  it("skips the request when there are no exercises", async () => {
    const requests = stubApi();
    expect(await getPreviousSetsForExercises([])).toEqual({
      success: true,
      data: {},
    });
    expect(requests).toHaveLength(0);
  });

  it("reports an unreachable server", async () => {
    stubApi(() => ({ networkError: true }));
    expect(await createWorkout(workout)).toEqual({
      success: false,
      error: "Could not reach the server. Check your connection.",
    });
  });
});
