import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        <Image src="./favicon.svg" alt="app logo" width={40} height={40} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Page not found
        </h1>
        <p className="text-muted-foreground max-w-md">
          We couldn&apos;t find what you were looking for. It may have been
          moved, or the workout you&apos;re after no longer exists.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/routines"
          className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
        >
          s Go to Dashboard
        </Link>
        <Link
          href="/"
          className="bg-muted border border-border text-foreground font-semibold px-5 py-2.5 rounded-xl hover:bg-muted/80 transition-colors"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
