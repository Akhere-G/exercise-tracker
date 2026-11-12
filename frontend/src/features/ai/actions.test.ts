// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { stubApi } from "@/tests/apiStub";

vi.mock("next/headers", () => import("@/tests/nextServer"));
vi.mock("next/cache", () => import("@/tests/nextServer"));
vi.mock("next/navigation", () => import("@/tests/navigation"));

import { buildRoutine, savePreview } from "./actions";
import { RoutinePreview } from "./types";

describe("AI routine builder actions", () => {
  it("saves every previewed routine in one batch, ordering items as shown", async () => {
    const requests = stubApi(() => ({ status: 201, data: [] }));
    const preview = {
      routines: [
        {
          name: "Upper",
          day: 0,
          items: [
            {
              exerciseId: 1,
              sets: 3,
              reps: 8,
              restSecs: 120,
              supersetGroup: null,
            },
            {
              exerciseId: 2,
              sets: 3,
              reps: 12,
              restSecs: 60,
              supersetGroup: 1,
            },
          ],
        },
      ],
    } as unknown as RoutinePreview;

    await savePreview(preview);

    expect(requests[0]).toMatchObject({
      method: "post",
      url: "/routines/batch",
    });
    expect(requests[0].data).toEqual([
      {
        name: "Upper",
        day: 0,
        routineItems: [
          {
            exerciseId: 1,
            targetSets: 3,
            targetReps: 8,
            restSecs: 120,
            supersetGroup: null,
            order: 0,
          },
          {
            exerciseId: 2,
            targetSets: 3,
            targetReps: 12,
            restSecs: 60,
            supersetGroup: 1,
            order: 1,
          },
        ],
      },
    ]);
  });

  it("surfaces the coach being unavailable", async () => {
    stubApi(() => ({
      status: 503,
      data: { detail: "The coach is unavailable right now." },
    }));
    const result = await buildRoutine({
      goal: "strength",
      equipment: ["barbell"],
      minutes: 45,
      daysPerWeek: 3,
    });
    expect(result).toMatchObject({
      success: false,
      status: 503,
      error: "The coach is unavailable right now.",
    });
  });
});
