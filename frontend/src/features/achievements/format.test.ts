import { describe, expect, it } from "vitest";
import { formatValue } from "./format";

describe("formatValue", () => {
  it("formats streaks in weeks", () => {
    expect(formatValue(1, "freq_streak_1")).toBe("1 week");
    expect(formatValue(4, "freq_streak_3")).toBe("4 weeks");
  });

  it("formats personal records per type", () => {
    expect(formatValue(100, "pr_weight")).toBe("100 kg");
    expect(formatValue(100, "pr_weight", "lb")).toBe("220.5 lb");
    expect(formatValue(1, "pr_reps")).toBe("1 rep");
    expect(formatValue(12, "pr_reps")).toBe("12 reps");
    expect(formatValue(5000, "pr_distance")).toBe("5 km");
    expect(formatValue(5250, "pr_distance")).toBe("5.3 km");
    expect(formatValue(90, "pr_duration")).toBe("1.5 mins");
  });

  it("falls back to the raw value for other achievements", () => {
    expect(formatValue(10, "milestone_workouts_10" as never)).toBe("10");
  });
});
