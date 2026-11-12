import { describe, expect, it } from "vitest";
import { weekKey } from "./utils";

describe("weekKey", () => {
  it("maps every day to the Monday that starts its week", () => {
    expect(weekKey(new Date(2026, 10, 2))).toBe("2026-11-02"); // Monday
    expect(weekKey(new Date(2026, 10, 5))).toBe("2026-11-02"); // Thursday
    expect(weekKey(new Date(2026, 10, 8, 23, 59))).toBe("2026-11-02"); // Sunday night
  });

  it("crosses month and year boundaries", () => {
    expect(weekKey(new Date(2027, 0, 1))).toBe("2026-12-28");
  });
});
