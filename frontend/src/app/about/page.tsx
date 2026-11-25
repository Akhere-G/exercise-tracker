import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SCREENSHOTS } from "@/src/lib/screenshots";
import {
  BarChart3,
  Bot,
  Dumbbell,
  Flame,
  Trophy,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About | Gains",
  description:
    "What Gains does, how its coaching works, and how the app is built.",
};

const FEATURES = [
  {
    icon: Zap,
    title: "Progression suggestions",
    body: "For each exercise, Gains suggests the next weight and rep target from how your last session went, one sensible step at a time.",
  },
  {
    icon: Flame,
    title: "Burnout checker",
    body: "If several lifts stall, or your effort stays very high for two weeks, Gains suggests an easier week and shows the numbers behind it.",
  },
  {
    icon: BarChart3,
    title: "Performance stats",
    body: "See hard sets per muscle group each week, how recovered each muscle is, and how your strength compares with where it was.",
  },
  {
    icon: Trophy,
    title: "Records and milestones",
    body: "Personal bests and weekly streaks are kept as a history, and 14 milestones are awarded when you save the workout that earns them.",
  },
  {
    icon: Dumbbell,
    title: "Built for the gym floor",
    body: "Warm-ups, drop sets, supersets and rest timers in one live workout that survives a page refresh or a dropped signal.",
  },
  {
    icon: Bot,
    title: "AI routine builder",
    body: "Describe the training you want and review the routine before you save it. Ready-made programmes are there if you would rather not use AI.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card/50">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-foreground">
            <Dumbbell className="h-5 w-5 text-primary" />
            <span className="font-bold">Gains</span>
          </Link>
          <Link href="/login" className="text-sm">
            Sign In
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-extrabold sm:text-4xl">About Gains</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground md:text-lg">
          Gains is a workout tracker that tells you what to do next. Its coaching
          follows simple rules that show their working, and an AI model is used
          only to draft routines you then review.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 text-left md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight">See it working</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {SCREENSHOTS.map((shot) => (
              <figure key={shot.src} className="m-0">
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  width={1440}
                  height={900}
                  className="h-auto w-full rounded-2xl border border-border"
                />
                <figcaption className="mt-2 text-sm text-muted-foreground">
                  {shot.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold tracking-tight">How it&apos;s built</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            The coaching rules and statistics run on the server, so the numbers
            are the same everywhere and can be tested on their own. Your
            current workout is saved on your device as you go, so a dropped
            signal does not lose a set. When the AI builder drafts a routine,
            its reply is checked before you see it and saved all at once or not
            at all.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            The README on GitHub lists each design decision, what it costs and
            where the code lives, along with the known limitations.
          </p>
          <Link
            href="https://github.com/Akhere-G/exercise-tracker"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex rounded-xl border border-border bg-muted px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80"
          >
            Read the code on GitHub
          </Link>
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto flex max-w-5xl flex-wrap gap-4 px-4 text-xs text-muted-foreground">
          <Link href="/">Home</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
