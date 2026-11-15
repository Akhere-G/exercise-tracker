import posthog from "posthog-js";
import { applyPostHogConsent } from "./consent";
import { readCookiePreferences } from "../cookie-consent/storage";

const KEY =
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ||
  "phc_wVvjmwnSPM5ExJaLiBedk7KjcXM5aftu62JARhZ2Xw6W";
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;
if (KEY) {
  try {
    posthog.init(KEY, {
      api_host: "/ingest",
      ui_host: HOST,
      cookieless_mode: "on_reject",
      persistence: "localStorage+cookie",
      consent_persistence_name: "gains_posthog_consent",
      person_profiles: "never",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: false,
      respect_dnt: true,
    });
    applyPostHogConsent(readCookiePreferences());
  } catch (error) {
    console.error("PostHog failed to initialise", error);
  }
}
