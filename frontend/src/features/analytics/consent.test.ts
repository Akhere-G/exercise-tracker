import { beforeEach, describe, expect, it, vi } from "vitest";

const posthog = vi.hoisted(() => ({
  __loaded: true,
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
}));
vi.mock("posthog-js", () => ({ default: posthog }));

import { applyPostHogConsent } from "./consent";

describe("PostHog consent", () => {
  beforeEach(() => {
    posthog.__loaded = true;
  });

  it("uses cookieless tracking before a choice or after rejection", () => {
    applyPostHogConsent(null);
    applyPostHogConsent({ analytics: false, updatedAt: "now", version: 1 });

    expect(posthog.opt_out_capturing).toHaveBeenCalledTimes(2);
    expect(posthog.opt_in_capturing).not.toHaveBeenCalled();
  });

  it("enables persistent analytics after acceptance", () => {
    applyPostHogConsent({ analytics: true, updatedAt: "now", version: 1 });

    expect(posthog.opt_in_capturing).toHaveBeenCalledWith({
      captureEventName: false,
    });
    expect(posthog.opt_out_capturing).not.toHaveBeenCalled();
  });

  it("waits until PostHog has loaded", () => {
    posthog.__loaded = false;
    applyPostHogConsent({ analytics: true, updatedAt: "now", version: 1 });

    expect(posthog.opt_in_capturing).not.toHaveBeenCalled();
    expect(posthog.opt_out_capturing).not.toHaveBeenCalled();
  });
});
