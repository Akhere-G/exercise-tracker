import { beforeEach, describe, expect, it, vi } from "vitest";

const posthog = vi.hoisted(() => ({
  __loaded: true,
  capture: vi.fn(),
  reset: vi.fn(),
  register: vi.fn(),
}));
vi.mock("posthog-js", () => ({ default: posthog }));

import { getFailureReason, getPageEvent, track } from "./utils";

describe("track", () => {
  beforeEach(() => {
    posthog.__loaded = true;
    posthog.capture.mockClear();
  });

  it("strips personally identifying properties before capturing", () => {
    track("create_workout_failed", {
      reason: "x",
      email: "a@b.c",
      password: "secret",
      token: "t",
    } as never);

    expect(posthog.capture).toHaveBeenCalledWith("create_workout_failed", {
      reason: "x",
    });
  });

  it("does nothing until analytics has loaded", () => {
    posthog.__loaded = false;

    track("start_workout", { source: "routine" });

    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("never throws when the analytics client fails", () => {
    posthog.capture.mockImplementationOnce(() => {
      throw new Error("blocked by ad blocker");
    });

    expect(() => track("start_workout", { source: "routine" })).not.toThrow();
  });
});

describe("getPageEvent", () => {
  it.each([
    ["/", "view_page_landing", "/"],
    ["/routines", "view_page_routines", "/routines"],
    ["/routines/", "view_page_routines", "/routines"],
    ["/routines/create", "view_page_routine_create", "/routines/create"],
    ["/routines/42", "view_page_routine_details", "/routines/[routineId]"],
    ["/routines/edit/42", "view_page_routine_edit", "/routines/edit/[routineId]"],
    ["/workouts/summary/9", "view_page_workout_summary", "/workouts/summary/[workoutId]"],
    ["/nope/at/all", "view_page_other", "other"],
  ])("maps %s", (path, event, route) => {
    expect(getPageEvent(path)).toEqual({ event, route });
  });
});

describe("getFailureReason", () => {
  it("never leaks long error text", () => {
    const reason = getFailureReason({ success: false, errors: "x".repeat(300) });

    expect(reason).toHaveLength(100);
  });

  it("classifies validation and generic failures", () => {
    expect(
      getFailureReason({
        success: false,
        errors: [{ type: "missing", loc: [], msg: "", input: null }],
      }),
    ).toBe("validation_missing");
    expect(getFailureReason({ success: false, error: "boom" })).toBe("request_failed");
    expect(getFailureReason({ success: false })).toBe("unknown");
  });
});
