"use client";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { WeightText } from "@/src/features/profile/components/Weight";
import { deleteBodyWeight } from "../actions";
import { BodyWeight } from "../types";

export default function BodyWeightList({ weights }: { weights: BodyWeight[] }) {
  const remove = async (id: number) => {
    const response = await deleteBodyWeight(id);
    if (!response.success) toast.error(response.error);
  };

  if (weights.length === 0) {
    return <p className="text-muted-foreground">No weigh-ins yet.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {[...weights]
        .sort((a, b) => b.measuredOn.localeCompare(a.measuredOn))
        .map((w) => (
          <li key={w.id} className="flex items-center justify-between py-2">
            <span>
              {new Date(`${w.measuredOn}T00:00:00`).toLocaleDateString(
                "en-GB",
                { weekday: "short", day: "numeric", month: "short", year: "numeric" },
              )}
            </span>
            <span className="flex items-center gap-2">
              <WeightText kg={w.weightKg} />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete weigh-in"
                onClick={() => remove(w.id)}
              >
                <Trash2 size={14} />
              </Button>
            </span>
          </li>
        ))}
    </ul>
  );
}
