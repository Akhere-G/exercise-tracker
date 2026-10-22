import posthog from "posthog-js";

const KEY =
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ||
  "phc_wVvjmwnSPM5ExJaLiBedk7KjcXM5aftu62JARhZ2Xw6W";
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;
console.log(`Host is ${HOST}`);
console.log(`Key is present: ${Boolean(KEY)}`);
if (KEY) {
  try {
    posthog.init(KEY, {
      api_host: "/ingest",
      ui_host: HOST,
      cookieless_mode: "always",
      person_profiles: "never",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      respect_dnt: true,
    });
  } catch (error) {
    console.error("PostHog failed to initialise", error);
  }
}
