import { describe, expect, it } from "vitest";
import { formatWeight, toDisplayWeight, toKg } from "./units";

describe("weight units", () => {
  it("shows kg as stored (to 2dp) and converts lb to 1dp", () => {
    expect(toDisplayWeight(100, "kg")).toBe(100);
    expect(toDisplayWeight(82.555, "kg")).toBe(82.56);
    expect(toDisplayWeight(100, "lb")).toBe(220.5);
    expect(toDisplayWeight(0, "lb")).toBe(0);
  });

  it("converts typed lb to kg for storage and leaves kg untouched", () => {
    expect(toKg(225, "lb")).toBe(102.058);
    expect(toKg(102.5, "kg")).toBe(102.5);
    expect(toKg(0, "lb")).toBe(0);
  });

  it("survives a round trip through the user's unit without drifting", () => {
    for (const lb of [45, 135, 225, 315, 2.5]) {
      expect(toDisplayWeight(toKg(lb, "lb"), "lb")).toBe(lb);
    }
  });

  it("formats with thousands separators and the unit", () => {
    expect(formatWeight(1234.5, "kg")).toBe("1,234.5 kg");
    expect(formatWeight(1000, "lb")).toBe("2,204.6 lb");
  });
});
