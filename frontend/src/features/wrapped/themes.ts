import { WrappedTheme } from "./types";

/** Copy for each slide. `{placeholders}` are filled in from the user's numbers. */
export interface ThemeCopy {
  name: string;
  emoji: string;
  /** CSS variable holding the theme's accent colour. */
  accent: string;
  intro: string;
  workouts: string;
  topExercise: string;
  muscle: string;
  habit: string;
  volume: string;
  records: string;
}

export const THEMES: Record<WrappedTheme, ThemeCopy> = {
  football: {
    name: "Football",
    emoji: "⚽",
    accent: "var(--wrapped-football)",
    intro: "Full time. Here is your season.",
    workouts: "{count} appearances",
    topExercise: "Golden Boot: {exercise}",
    muscle: "Player of the match: {group}",
    habit: "Your favourite kick-off: {weekday} {time}",
    volume: "You moved {volume}",
    records: "{count} new records. A hat-trick of PBs.",
  },
  f1: {
    name: "Formula 1",
    emoji: "🏎️",
    accent: "var(--wrapped-f1)",
    intro: "Lights out. Here is your season.",
    workouts: "{count} race weekends",
    topExercise: "Pole position: {exercise}",
    muscle: "Fastest lap: {group}",
    habit: "You qualify best on {weekday} {time}",
    volume: "You moved {volume}",
    records: "{count} new personal bests on the board.",
  },
  boxing: {
    name: "Boxing",
    emoji: "🥊",
    accent: "var(--wrapped-boxing)",
    intro: "Final bell. Here is your fight card.",
    workouts: "{count} rounds in the ring",
    topExercise: "Signature move: {exercise}",
    muscle: "Heaviest hitter: {group}",
    habit: "You fight best on {weekday} {time}",
    volume: "You moved {volume}",
    records: "{count} new records. Knockout.",
  },
  basketball: {
    name: "Basketball",
    emoji: "🏀",
    accent: "var(--wrapped-basketball)",
    intro: "Buzzer beater. Here is your season.",
    workouts: "{count} games played",
    topExercise: "MVP: {exercise}",
    muscle: "Top scorer: {group}",
    habit: "Tip-off is {weekday} {time}",
    volume: "You moved {volume}",
    records: "{count} new career highs.",
  },
  athletics: {
    name: "Athletics",
    emoji: "🏃",
    accent: "var(--wrapped-athletics)",
    intro: "On your marks. Here is your season.",
    workouts: "{count} meets",
    topExercise: "Gold medal event: {exercise}",
    muscle: "Strongest leg: {group}",
    habit: "You peak on {weekday} {time}",
    volume: "You moved {volume}",
    records: "{count} new personal bests.",
  },
};

export const THEME_ORDER = Object.keys(THEMES) as WrappedTheme[];
export const DEFAULT_THEME: WrappedTheme = "football";
