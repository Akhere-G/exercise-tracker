import { describe, expect, it, vi } from "vitest";
import { stubApi } from "@/tests/apiStub";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

import { createWorkout, deleteWorkout, updateWorkout } from "./actions";

const workout = {
  completedAt: new Date("2025-01-06T10:00:00Z"),
  duration: 1800,
  routineId: 7,
  sets: [{ exerciseId: 1, setIndex: 1, reps: 5, weight: 60 }],
};

describe("createWorkout", () => {
  it("posts the workout and returns the saved record", async () => {
    const requests = stubApi(() => ({ status: 201, data: { id: 99, ...workout } }));

    const result = await createWorkout(workout);

    expect(result).toMatchObject({ success: true, data: { id: 99 } });
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      method: "post",
      url: "/workouts",
      data: {
        routineId: 7,
        duration: 1800,
        completedAt: "2025-01-06T10:00:00.000Z",
        sets: [{ exerciseId: 1, reps: 5, weight: 60 }],
      },
    });
  });

  it("maps a validation error to a readable message", async () => {
    stubApi(() => ({
      status: 422,
      data: {
        detail: [{ loc: ["body", "sets"], msg: "too many sets", type: "too_long", input: [] }],
      },
    }));

    expect(await createWorkout(workout)).toMatchObject({
      success: false,
      error: "sets: too many sets",
      status: 422,
    });
  });

  it("reports a network failure instead of throwing", async () => {
    stubApi(() => ({ networkError: true }));

    expect(await createWorkout(workout)).toEqual({
      success: false,
      error: "Could not reach the server. Check your connection.",
    });
  });
});

describe("updateWorkout", () => {
  it("patches the workout, converting minutes to seconds", async () => {
    const requests = stubApi(() => ({ status: 200, data: { id: 5, ...workout } }));

    await updateWorkout(5, { ...workout, duration: 30 });

    expect(requests[0]).toMatchObject({
      method: "patch",
      url: "/workouts/5",
      data: { duration: 1800 },
    });
  });
});

describe("deleteWorkout", () => {
  it("returns the API error for a missing workout", async () => {
    stubApi(() => ({ status: 404, data: { detail: "Workout not found" } }));

    expect(await deleteWorkout(404)).toMatchObject({
      success: false,
      error: "Workout not found",
      status: 404,
    });
  });
});
