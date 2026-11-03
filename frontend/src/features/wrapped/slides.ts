import { formatWeight, WeightUnit } from "@/src/lib/units";
import { THEMES } from "./themes";
import { Wrapped, WrappedTheme } from "./types";

export interface Slide {
  id: string;
  headline: string;
  detail?: string;
}

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));

const formatHours = (secs: number) => `${Math.round(secs / 360) / 10} hours`;

/** The tap-through story, leaving out any slide the period has no data for. */
export function buildSlides(
  wrapped: Wrapped,
  theme: WrappedTheme,
  unit: WeightUnit,
): Slide[] {
  const copy = THEMES[theme];
  const slides: (Slide | false | null)[] = [
    { id: "intro", headline: copy.intro },
    {
      id: "workouts",
      headline: fill(copy.workouts, { count: wrapped.workoutCount }),
      detail: `${wrapped.totalSets} sets over ${formatHours(wrapped.totalDurationSecs)}`,
    },
    wrapped.topExercise && {
      id: "exercise",
      headline: fill(copy.topExercise, { exercise: wrapped.topExercise.name }),
      detail: `${wrapped.topExercise.count} sets`,
    },
    wrapped.topMuscleGroup && {
      id: "muscle",
      headline: fill(copy.muscle, { group: wrapped.topMuscleGroup.name }),
      detail: `${wrapped.topMuscleGroup.count} hard sets`,
    },
    wrapped.favouriteWeekday !== null &&
      !!wrapped.favouriteTimeOfDay && {
        id: "habit",
        headline: fill(copy.habit, {
          weekday: WEEKDAYS[wrapped.favouriteWeekday],
          time: wrapped.favouriteTimeOfDay,
        }),
        detail: `Longest streak: ${wrapped.longestStreakDays} days in a row`,
      },
    wrapped.totalVolume > 0 && {
      id: "volume",
      headline: fill(copy.volume, {
        volume: formatWeight(wrapped.totalVolume, unit),
      }),
      detail: wrapped.equivalence
        ? `That is about ${wrapped.equivalence.count} ${wrapped.equivalence.label}`
        : undefined,
    },
    wrapped.prCount > 0 && {
      id: "records",
      headline: fill(copy.records, { count: wrapped.prCount }),
      detail: wrapped.milestones.length
        ? `Plus ${wrapped.milestones.length} milestones`
        : undefined,
    },
  ];
  return slides.filter((slide): slide is Slide => Boolean(slide));
}
