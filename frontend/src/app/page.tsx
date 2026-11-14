import Link from "next/link";
import {
  BarChart3,
  Dumbbell,
  Flame,
  ListChecks,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { DemoLoginButton } from "@/src/features/auth/components/DemoLoginButton";

const FEATURES = [
  {
    icon: Zap,
    title: "Smart progression suggestions",
    body: "After each set, Gains suggests the next weight and rep target based on how you performed last time. Progress happens one sensible step at a time, so you stop guessing and start getting stronger.",
  },
  {
    icon: Flame,
    title: "Burnout checker",
    body: "When your lifts stall or your effort stays high for weeks, Gains spots the warning signs and suggests an easier week. Train hard without quietly running yourself into the ground.",
  },
  {
    icon: BarChart3,
    title: "Performance stats",
    body: "Charts show how many hard sets each muscle group gets every week, how recovered it is, and how your strength compares to where it was. Spot the gaps in your programme at a glance.",
  },
  {
    icon: Target,
    title: "Goal-centred training",
    body: "Set a weekly training target, a body weight goal or a lift you are chasing, and watch your progress build on your routines page. Onboarding takes a minute and tailors everything to you.",
  },
  {
    icon: Trophy,
    title: "Achievements and milestones",
    body: "Fourteen achievements reward consistency, new personal bests and variety in your training. Each one is earned the moment you save the workout that unlocks it.",
  },
];

const HIGHLIGHTS = [
  {
    icon: Dumbbell,
    title: "Built for the gym floor",
    body: "Warm-ups, drop sets, supersets and rest timers, all in one live workout that survives a page refresh.",
  },
  {
    icon: TrendingUp,
    title: "Your numbers, in your units",
    body: "Switch between kilograms and pounds at any time. Your history is always kept accurately behind the scenes.",
  },
  {
    icon: ListChecks,
    title: "Powerful workout templates",
    body: "Pick a ready-made programme, or describe the training you want and let Gains build a routine you can review before saving.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Dumbbell className="h-5 w-5 text-primary" />
            <span>Gains</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Register
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center gap-16 w-full">
        <section className="flex flex-col gap-4 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Train smarter. <br />
            <span className="text-primary">See every gain.</span>
          </h1>
          <p className="text-muted-foreground md:text-lg">
            Gains is the fitness tracker that tells you what to do next. It
            guides your progression, protects you from burnout and turns every
            workout into visible progress, so you keep getting stronger for
            the long run.
          </p>
        </section>

        <section className="flex flex-col sm:flex-row gap-4 w-full justify-center items-start">
          <DemoLoginButton
            className="w-full md:w-auto"
            buttonClassName="text-base font-semibold h-auto py-3 px-6 rounded-xl"
          />
          <Link
            href="/register"
            className="bg-primary w-full md:w-auto text-primary-foreground font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-sm text-center"
          >
            Create Your Account
          </Link>
          <Link
            href="/routines"
            className="bg-muted w-full md:w-auto border border-border text-foreground font-semibold px-6 py-3 rounded-xl hover:bg-muted/80 transition-colors text-center"
          >
            Go to Dashboard
          </Link>
        </section>

        <section className="flex flex-col gap-8 w-full">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Everything you need to progress
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Gains does the thinking between sets, so you can focus on the
              lifting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              const isLastFeature = index === FEATURES.length - 1;
              return (
                <div
                  key={feature.title}
                  className={`bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col gap-3 ${isLastFeature ? "md:col-span-3" : ""}`}
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.body}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          {HIGHLIGHTS.map((highlight) => {
            const Icon = highlight.icon;
            return (
              <div
                key={highlight.title}
                className="flex flex-col gap-2 p-6 border border-border rounded-2xl bg-card/30"
              >
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{highlight.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {highlight.body}
                </p>
              </div>
            );
          })}
        </section>

        <section className="flex flex-col items-center gap-4 w-full bg-card border border-border rounded-2xl p-8 md:p-12 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Your next personal best starts with one workout.
          </h2>
          <p className="text-muted-foreground max-w-xl">
            Create a free account in under a minute, or explore the app first
            with the demo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-sm text-center"
            >
              Get Started
            </Link>
            <DemoLoginButton
              className="w-full sm:w-auto"
              buttonClassName="text-base font-semibold h-auto py-3 px-6 rounded-xl"
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 bg-card/30">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Gains. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/routines" className="hover:underline">
              Routines
            </Link>
            <Link href="/exercises" className="hover:underline">
              Exercises
            </Link>
            <Link href="/stats" className="hover:underline">
              Analytics
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
