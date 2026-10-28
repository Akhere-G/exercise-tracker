import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { STATS_RANGES, StatsRange } from "../types";

export default function StatsRangeSelector({ active }: { active: StatsRange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {STATS_RANGES.map(({ value, label }) => (
        <Button
          key={value}
          asChild
          variant={value === active ? "default" : "secondary"}
        >
          <Link
            href={`/stats?range=${value}`}
            aria-current={value === active ? "page" : undefined}
            className={value === active ? "text-primary-foreground" : ""}
          >
            {label}
          </Link>
        </Button>
      ))}
    </div>
  );
}
