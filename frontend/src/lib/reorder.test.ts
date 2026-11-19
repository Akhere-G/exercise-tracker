import { describe, expect, it } from "vitest";
import { moveItem } from "./reorder";

describe("moveItem", () => {
  it("moves an item forwards and backwards", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("returns an unchanged copy for a no-op or out-of-range move", () => {
    const items = ["a", "b"];
    expect(moveItem(items, 1, 1)).toEqual(["a", "b"]);
    expect(moveItem(items, -1, 0)).toEqual(["a", "b"]);
    expect(moveItem(items, 5, 0)).toEqual(["a", "b"]);
    expect(moveItem(items, 0, 1)).not.toBe(items);
  });
});
