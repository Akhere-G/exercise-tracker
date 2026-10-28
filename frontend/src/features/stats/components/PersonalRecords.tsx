import Link from "next/link";
import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/src/components/card";
import { formatValue } from "@/src/features/achievements/components/AchievementCard";
import { AchievementTypes } from "@/src/features/achievements/types";
import { PersonalRecord } from "../types";

export default function PersonalRecords({ records }: { records: PersonalRecord[] }) {
  if (records.length === 0) return null;

  return (
    <section>
      <h3 className="text-xl">Recent personal records</h3>
      <p className="text-xs text-muted-foreground mb-4">
        All-time bests, not affected by the date range.
      </p>
      <div className="flex flex-col gap-2">
        {records.map((record) => (
          <Card key={record.id}>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Trophy size={20} className="shrink-0" />
                <Link
                  href={`/exercises/${record.exerciseId}`}
                  className="truncate"
                >
                  {record.exerciseName}
                </Link>
              </div>
              <p className="text-nowrap">
                {formatValue(record.value, record.type as AchievementTypes)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
