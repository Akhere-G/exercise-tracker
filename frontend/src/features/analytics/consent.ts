import posthog from "posthog-js";
import type { CookiePreferences } from "../cookie-consent/types";

export function applyPostHogConsent(
  preferences: CookiePreferences | null,
): void {
  if (!posthog.__loaded) return;

  if (preferences?.analytics) {
    posthog.opt_in_capturing({ captureEventName: false });
    return;
  }

  posthog.opt_out_capturing();
}
