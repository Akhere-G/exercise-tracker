import { LogoutButton } from "@/src/features/auth/components/LogoutButton";
import Link from "next/link";

export function DemoBanner() {
  return (
    <div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary px-4 py-2 text-sm text-secondary-foreground">
      <p>You&apos;re exploring a demo. Changes reset regularly.</p>
      <div className="flex items-center gap-3">
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create account
        </Link>
        <LogoutButton label="Exit demo" />
      </div>
    </div>
  );
}
