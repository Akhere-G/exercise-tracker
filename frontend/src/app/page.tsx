import Link from "next/link";
import { BarChart3, Dumbbell, PlusCircle } from "lucide-react";

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

      <main className="flex-1 max-w-5xl mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center gap-12">
        <div className="flex flex-col gap-4 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Elevate your training. <br />
            <span className="text-primary">Track your progress.</span>
          </h1>
          <p className="text-muted-foreground md:text-lg">
            The ultimate companion to build custom workout routines,
            effortlessly log your training sessions, and beautifully visualise
            your consistency over time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/register"
            className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-sm text-center"
          >
            Create Your Account
          </Link>
          <Link
            href="/routines"
            className="bg-muted border border-border text-foreground font-semibold px-6 py-3 rounded-xl hover:bg-muted/80 transition-colors text-center"
          >
            Go to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mt-8">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <PlusCircle className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">Customise Routines</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Design tailored training programmes that fit your current
              macrocycle. Organise your favorite movements and set your targets
              before heading to the gym floor.
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Dumbbell className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">Live Workout Execution</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Execute active training sessions with an intuitive, clutter-free
              logging system. Track reps, loads, and rest periods dynamically
              without missing a beat.
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">Advanced Analytics</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Keep an eye on key training metrics. Watch your estimated 1RM
              scale up, view rep zone distributions, and monitor absolute volume
              changes across timelines.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-6 bg-card/30">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} TrackFit. All rights reserved.
          </p>
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
