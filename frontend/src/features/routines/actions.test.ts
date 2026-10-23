import { describe, expect, it, vi } from "vitest";
import { stubApi } from "@/tests/apiStub";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

import { createRoutine, deleteRoutine, editRoutine } from "./actions";
import { RoutineSchema } from "./schema";

const routine: RoutineSchema = {
  name: "Push day",
  day: 2,
  startTime: "18:30",
  routineItems: [
    { exerciseId: 1, targetSets: 3, targetReps: 8, order: 0 },
    { exerciseId: 3, targetSets: 1, targetDuration: 600, order: 1 },
  ],
};

describe("createRoutine", () => {
  it("posts the routine, mapping target duration to seconds", async () => {
    const requests = stubApi(() => ({ status: 201, data: { id: 1 } }));

    const result = await createRoutine(routine);

    expect(result).toMatchObject({ success: true, data: { id: 1 } });
    expect(requests[0]).toMatchObject({ method: "post", url: "/routines" });
    const body = requests[0].data as { routineItems: Record<string, unknown>[] };
    expect(body.routineItems.map((i) => i.exerciseId)).toEqual([1, 3]);
    expect(body.routineItems[0].targetDurationSecs).toBeUndefined();
    expect(body.routineItems[1].targetDurationSecs).toBe(600);
  });

  it("surfaces backend validation failures", async () => {
    stubApi(() => ({ status: 422, data: { detail: "Duplicate exercise in routine" } }));

    expect(await createRoutine(routine)).toMatchObject({
      success: false,
      error: "Duplicate exercise in routine",
      status: 422,
    });
  });
});

describe("editRoutine", () => {
  it("patches only the routine fields, dropping embedded exercise objects", async () => {
    const requests = stubApi(() => ({ status: 200, data: { id: 4 } }));
    const withExercise = {
      ...routine,
      routineItems: [
        {
          ...routine.routineItems[0],
          exercise: { id: 1, name: "Bench" },
        },
      ],
    };

    await editRoutine(withExercise, 4);

    expect(requests[0]).toMatchObject({ method: "patch", url: "/routines/4" });
    const body = requests[0].data as { day: string; routineItems: Record<string, unknown>[] };
    expect(body.day).toBe("2");
    expect(body.routineItems[0]).not.toHaveProperty("exercise");
    expect(body.routineItems[0]).toMatchObject({ exerciseId: 1, order: 0 });
  });
});

describe("deleteRoutine", () => {
  it("returns success on delete", async () => {
    const requests = stubApi(() => ({ status: 200, data: 4 }));

    expect(await deleteRoutine(4)).toEqual({ success: true, data: 4 });
    expect(requests[0]).toMatchObject({ method: "delete", url: "/routines/4" });
  });

  it("reports a network failure", async () => {
    stubApi(() => ({ networkError: true }));

    expect(await deleteRoutine(4)).toMatchObject({ success: false });
  });
});
