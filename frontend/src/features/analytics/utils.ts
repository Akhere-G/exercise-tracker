import posthog from "posthog-js";
import type { ActionResponse } from "@/src/lib/apiTypes";
import type {
  AnalyticsArgs,
  AnalyticsEventName,
  PageViewEvent,
} from "./types";

const BLOCKED_PROPERTY_KEYS = new Set([
  "email",
  "password",
  "username",
  "name",
  "title",
  "query",
  "token",
]);

const PAGE_ROUTES: { pattern: RegExp; route: string; event: PageViewEvent }[] = [
  { pattern: /^\/$/, route: "/", event: "view_page_landing" },
  { pattern: /^\/login$/, route: "/login", event: "view_page_login" },
  { pattern: /^\/register$/, route: "/register", event: "view_page_register" },
  { pattern: /^\/routines$/, route: "/routines", event: "view_page_routines" },
  {
    pattern: /^\/routines\/create$/,
    route: "/routines/create",
    event: "view_page_routine_create",
  },
  {
    pattern: /^\/routines\/edit\/[^/]+$/,
    route: "/routines/edit/[routineId]",
    event: "view_page_routine_edit",
  },
  {
    pattern: /^\/routines\/[^/]+$/,
    route: "/routines/[routineId]",
    event: "view_page_routine_details",
  },
  { pattern: /^\/workouts$/, route: "/workouts", event: "view_page_workouts" },
  {
    pattern: /^\/workouts\/active$/,
    route: "/workouts/active",
    event: "view_page_workout_active",
  },
  {
    pattern: /^\/workouts\/edit\/[^/]+$/,
    route: "/workouts/edit/[workoutId]",
    event: "view_page_workout_edit",
  },
  {
    pattern: /^\/workouts\/summary\/[^/]+$/,
    route: "/workouts/summary/[workoutId]",
    event: "view_page_workout_summary",
  },
  {
    pattern: /^\/exercises$/,
    route: "/exercises",
    event: "view_page_exercises",
  },
  {
    pattern: /^\/exercises\/[^/]+$/,
    route: "/exercises/[exerciseId]",
    event: "view_page_exercise_details",
  },
  {
    pattern: /^\/achievements$/,
    route: "/achievements",
    event: "view_page_achievements",
  },
  { pattern: /^\/settings$/, route: "/settings", event: "view_page_settings" },
];

export function getPageEvent(pathname: string): {
  event: PageViewEvent;
  route: string;
} {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const match = PAGE_ROUTES.find(({ pattern }) => pattern.test(path));
  return match
    ? { event: match.event, route: match.route }
    : { event: "view_page_other", route: "other" };
}

export function track<E extends AnalyticsEventName>(
  event: E,
  ...[props]: AnalyticsArgs<E>
): void {
  try {
    if (!posthog.__loaded) return;
    const safeProps = props
      ? Object.fromEntries(
          Object.entries(props).filter(
            ([key]) => !BLOCKED_PROPERTY_KEYS.has(key),
          ),
        )
      : undefined;
    posthog.capture(event, safeProps);
  } catch {}
}

export function resetAnalytics(): void {
  try {
    if (posthog.__loaded) posthog.reset();
  } catch {}
}

export function markDemoSession(): void {
  try {
    if (posthog.__loaded) posthog.register({ is_demo: true });
  } catch {}
}

export function getFailureReason(
  response: Extract<ActionResponse<unknown>, { success: false }>,
): string {
  const detail: unknown = response.errors;
  if (typeof detail === "string") return detail.slice(0, 100);
  if (Array.isArray(detail) && detail.length > 0) {
    const type: unknown = detail[0]?.type;
    if (typeof type === "string") return `validation_${type}`;
  }
  return response.error ? "request_failed" : "unknown";
}
