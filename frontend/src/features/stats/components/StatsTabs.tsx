import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { STATS_TABS, StatsRange, StatsTab } from "../types";

export default function StatsTabs({
  active,
  range,
}: {
  active: StatsTab;
  range: StatsRange;
}) {
  return (
    <nav className="mt-4 flex gap-2 overflow-x-auto" aria-label="Stats sections">
      {STATS_TABS.map(({ value, label }) => (
        <Button
          key={value}
          asChild
          variant={value === active ? "default" : "secondary"}
        >
          <Link
            href={`/stats?tab=${value}&range=${range}`}
            aria-current={value === active ? "page" : undefined}
            className={value === active ? "text-primary-foreground" : ""}
          >
            {label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
