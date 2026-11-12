// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { stubApi } from "@/tests/apiStub";

vi.mock("next/headers", () => import("@/tests/nextServer"));
vi.mock("next/cache", () => import("@/tests/nextServer"));
vi.mock("next/navigation", () => import("@/tests/navigation"));

import { completeOnboarding, skipOnboarding } from "./actions";

const answers = {
  goal: "strength",
  experience: "beginner",
  workoutsPerWeek: 4,
  weightUnit: "lb",
  sex: "female",
  bodyWeightKg: 61.235,
  coachPersona: "physio",
  timezone: "Europe/London",
} as const;

describe("onboarding actions", () => {
  it("saves body weight, then the profile, marking the user onboarded", async () => {
    const requests = stubApi(() => ({ status: 200, data: {} }));

    const result = await completeOnboarding(answers);

    expect(result.success).toBe(true);
    expect(requests.map((r) => `${r.method} ${r.url}`)).toEqual([
      "put /body/weights",
      "patch /profile",
    ]);
    expect(requests[0].data).toMatchObject({ weightKg: 61.235 });
    expect(requests[1].data).toMatchObject({
      workoutsPerWeekTarget: 4,
      weightUnit: "lb",
      coachPersona: "physio",
      onboardedAt: expect.any(String),
    });
  });

  it("skips the body weight request when none was given", async () => {
    const requests = stubApi(() => ({ status: 200, data: {} }));
    await completeOnboarding({ ...answers, bodyWeightKg: null });
    expect(requests.map((r) => r.url)).toEqual(["/profile"]);
  });

  it("stops before marking the user onboarded if the weight fails to save", async () => {
    const requests = stubApi(() => ({
      status: 422,
      data: { detail: "Weight out of range" },
    }));
    expect(await completeOnboarding(answers)).toEqual({
      success: false,
      error: "Weight out of range",
    });
    expect(requests).toHaveLength(1);
  });

  it("skipping still marks the user onboarded", async () => {
    const requests = stubApi(() => ({ status: 200, data: {} }));
    await skipOnboarding();
    expect(requests[0]).toMatchObject({
      url: "/profile",
      data: { onboardedAt: expect.any(String) },
    });
  });
});
