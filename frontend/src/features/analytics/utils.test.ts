import { beforeEach, describe, expect, it, vi } from "vitest";

const posthog = vi.hoisted(() => ({
  __loaded: true,
  capture: vi.fn(),
  reset: vi.fn(),
  register: vi.fn(),
}));
vi.mock("posthog-js", () => ({ default: posthog }));

import { getFailureReason, getPageEvent, track } from "./utils";

describe("getPageEvent", () => {
  it.each([
    ["/", "view_page_landing", "/"],
    ["/routines/", "view_page_routines", "/routines"],
    ["/routines/create", "view_page_routine_create", "/routines/create"],
    [
      "/routines/edit/12",
      "view_page_routine_edit",
      "/routines/edit/[routineId]",
    ],
    ["/routines/12", "view_page_routine_details", "/routines/[routineId]"],
    [
      "/workouts/summary/9",
      "view_page_workout_summary",
      "/workouts/summary/[workoutId]",
    ],
    ["/stats", "view_page_other", "other"],
  ])("%s → %s", (path, event, route) => {
    expect(getPageEvent(path)).toEqual({ event, route });
  });
});

describe("track", () => {
  beforeEach(() => {
    posthog.__loaded = true;
  });

  it("never sends personal data keys", () => {
    track("register_failed", {
      reason: "duplicate",
      email: "sam@example.com",
      password: "Password1",
      username: "sam",
    } as never);

    expect(posthog.capture).toHaveBeenCalledWith("register_failed", {
      reason: "duplicate",
    });
  });

  it("does nothing until analytics has loaded", () => {
    posthog.__loaded = false;
    track("register");
    expect(posthog.capture).not.toHaveBeenCalled();
  });
});

describe("getFailureReason", () => {
  it("summarises API failures without leaking long messages", () => {
    expect(
      getFailureReason({ success: false, errors: "x".repeat(150) }),
    ).toHaveLength(100);
    expect(
      getFailureReason({
        success: false,
        errors: [
          {
            type: "value_error",
            loc: ["body", "email"],
            msg: "bad",
            input: "",
          },
        ],
      }),
    ).toBe("validation_value_error");
    expect(getFailureReason({ success: false, error: "Server down" })).toBe(
      "request_failed",
    );
    expect(getFailureReason({ success: false })).toBe("unknown");
  });
});
