import { describe, expect, it } from "vitest";
import { getSessionOwnerId } from "./session";

const tokenFor = (payload: unknown) =>
  `header.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.signature`;

describe("getSessionOwnerId", () => {
  it("gives the same short, opaque id for the same user", () => {
    const id = getSessionOwnerId(tokenFor({ sub: "sam@example.com" }));
    expect(id).toMatch(/^[0-9a-f]{16}$/);
    expect(
      getSessionOwnerId(tokenFor({ sub: "sam@example.com", exp: 1 })),
    ).toBe(id);
    expect(id).not.toContain("sam");
  });

  it("gives different ids for different users", () => {
    expect(getSessionOwnerId(tokenFor({ sub: "a@example.com" }))).not.toBe(
      getSessionOwnerId(tokenFor({ sub: "b@example.com" })),
    );
  });

  it.each([undefined, "", "not-a-jwt", tokenFor({ sub: 42 }), tokenFor(null)])(
    "returns null for %s",
    (token) => {
      expect(getSessionOwnerId(token)).toBeNull();
    },
  );
});
