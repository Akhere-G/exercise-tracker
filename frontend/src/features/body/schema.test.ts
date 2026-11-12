import { describe, expect, it } from "vitest";
import { bodyWeightSchema } from "./schema";

describe("bodyWeightSchema", () => {
  it.each([
    [{ measuredOn: "2026-11-01", weight: 80.4 }, null],
    [{ measuredOn: "", weight: 80 }, "Pick a date"],
    [{ measuredOn: "2026-11-01", weight: "" }, "Enter your weight"],
    [{ measuredOn: "2026-11-01", weight: 0 }, "Weight must be above zero"],
    [{ measuredOn: "2026-11-01", weight: 1501 }, "That looks too high"],
  ])("%o → %s", (value, message) => {
    if (message === null) {
      expect(bodyWeightSchema.isValidSync(value)).toBe(true);
    } else {
      expect(() => bodyWeightSchema.validateSync(value)).toThrow(message);
    }
  });
});
