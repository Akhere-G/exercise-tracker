import Link from "next/link";
import { Dumbbell } from "lucide-react";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-foreground">
            <Dumbbell className="h-5 w-5 text-primary" />
            <span className="font-bold">Gains</span>
          </Link>
          <Link href="/settings" className="text-sm">
            Settings
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <div className="mb-10 border-b border-border pb-8">
          <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {updated}
          </p>
        </div>
        <article className="space-y-8 text-sm leading-7 text-muted-foreground [&_a]:underline [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3">
          {children}
        </article>
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto flex max-w-4xl flex-wrap gap-4 px-4 text-xs text-muted-foreground">
          <Link href="/">Home</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
