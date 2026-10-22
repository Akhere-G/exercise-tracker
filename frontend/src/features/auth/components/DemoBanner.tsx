import { DemoFlag } from "@/src/features/analytics/components/DemoFlag";
import { DemoCreateAccountLink } from "@/src/features/auth/components/DemoCreateAccountLink";
import { LogoutButton } from "@/src/features/auth/components/LogoutButton";

export function DemoBanner() {
  return (
    <div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary px-4 py-2 text-sm text-secondary-foreground">
      <DemoFlag />
      <p>You&apos;re exploring a demo. Changes reset regularly.</p>
      <div className="flex items-center gap-3">
        <DemoCreateAccountLink />
        <LogoutButton label="Exit demo" source="demo_banner" />
      </div>
    </div>
  );
}
