// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { stubApi } from "@/tests/apiStub";
import { benchPress, plank } from "@/tests/factories";

vi.mock("next/headers", () => import("@/tests/nextServer"));
vi.mock("next/navigation", () => import("@/tests/navigation"));

import { createRoutine, deleteRoutine, editRoutine } from "./actions";

const routine = {
  name: "Push day",
  day: 2,
  startTime: "13:00:00Z",
  routineItems: [
    {
      exerciseId: benchPress.id,
      exercise: benchPress,
      targetSets: 3,
      targetReps: 8,
      order: 0,
    },
    {
      exerciseId: plank.id,
      exercise: plank,
      targetSets: 2,
      targetReps: null,
      targetDuration: 45,
      order: 1,
    },
  ],
};

describe("routine actions", () => {
  it("sends the duration target in seconds under the API's field name", async () => {
    const requests = stubApi(() => ({ status: 201, data: { id: 1 } }));

    const result = await createRoutine(routine);

    expect(result).toEqual({ success: true, data: { id: 1 } });
    const [bench, timed] = (
      requests[0].data as { routineItems: Record<string, unknown>[] }
    ).routineItems;
    expect(requests[0]).toMatchObject({ method: "post", url: "/routines" });
    expect(bench.targetDurationSecs).toBeUndefined();
    expect(timed).toMatchObject({
      exerciseId: plank.id,
      targetDurationSecs: 45,
    });
  });

  it("strips client-only fields when editing", async () => {
    const requests = stubApi(() => ({ status: 200, data: { id: 9 } }));

    await editRoutine(routine, 9);

    expect(requests[0]).toMatchObject({ method: "patch", url: "/routines/9" });
    const [, timed] = (
      requests[0].data as { routineItems: Record<string, unknown>[] }
    ).routineItems;
    expect(timed).not.toHaveProperty("exercise");
    expect(timed).not.toHaveProperty("targetDuration");
    expect(timed.targetDurationSecs).toBe(45);
  });

  it("returns API errors instead of throwing", async () => {
    stubApi(() => ({ status: 404, data: { detail: "Routine not found" } }));
    expect(await deleteRoutine(5)).toMatchObject({
      success: false,
      error: "Routine not found",
      status: 404,
    });
  });
});
