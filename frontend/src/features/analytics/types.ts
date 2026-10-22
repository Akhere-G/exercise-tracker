export type PageViewProps = { route: string };

export type PageViewEvent =
  | "view_page_landing"
  | "view_page_login"
  | "view_page_register"
  | "view_page_routines"
  | "view_page_routine_create"
  | "view_page_routine_edit"
  | "view_page_routine_details"
  | "view_page_workouts"
  | "view_page_workout_active"
  | "view_page_workout_edit"
  | "view_page_workout_summary"
  | "view_page_exercises"
  | "view_page_exercise_details"
  | "view_page_achievements"
  | "view_page_settings"
  | "view_page_other";

type AuthMethod = "password" | "demo";
type WorkoutSource = "routine" | "empty";

export type AnalyticsEvents = {
  [E in PageViewEvent]: PageViewProps;
} & {
  login: { method: AuthMethod };
  login_failed: { method: AuthMethod; reason: string };
  register: undefined;
  register_failed: { reason: string };
  logout: { source: "settings" | "demo_banner" };
  click_demo_create_account: undefined;
  click_import_data: undefined;
  click_export_data: undefined;
  click_create_routine: undefined;
  create_routine: {
    routine_id: number;
    exercise_count: number;
    day: number;
    has_duration_target: boolean;
  };
  create_routine_failed: { reason: string };
  delete_routine: undefined;
  click_start_workout: { source: WorkoutSource };
  start_workout: { source: WorkoutSource };
  complete_workout: {
    workout_id: number;
    duration_seconds: number;
    set_count: number;
    exercise_count: number;
    has_routine: boolean;
  };
  create_workout_failed: { reason: string };
  cancel_workout: { completed_sets: number };
  delete_workout: undefined;
  search_exercises: {
    query_length: number;
    result_count: number;
    has_equipment_filter: boolean;
    has_muscle_filter: boolean;
  };
  achievement_unlocked: { achievement_type: string };
  enable_notifications: undefined;
  dismiss_notifications_prompt: undefined;
};

export type AnalyticsEventName = keyof AnalyticsEvents;

export type AnalyticsArgs<E extends AnalyticsEventName> =
  AnalyticsEvents[E] extends undefined ? [] : [props: AnalyticsEvents[E]];
