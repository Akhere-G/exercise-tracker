import { describe, expect, it } from "vitest";
import { getSessionOwnerId } from "./session";

const jwt = (payload: unknown) =>
  `header.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.sig`;

describe("getSessionOwnerId", () => {
  it("returns a stable, opaque id derived from the subject", () => {
    const id = getSessionOwnerId(jwt({ sub: "a@example.com" }));

    expect(id).toMatch(/^[0-9a-f]{16}$/);
    expect(id).toBe(getSessionOwnerId(jwt({ sub: "a@example.com", exp: 1 })));
    expect(id).not.toContain("example");
  });

  it("gives different users different ids", () => {
    expect(getSessionOwnerId(jwt({ sub: "a@example.com" }))).not.toBe(
      getSessionOwnerId(jwt({ sub: "b@example.com" })),
    );
  });

  it.each([
    ["no token", undefined],
    ["empty token", ""],
    ["not a jwt", "garbage"],
    ["undecodable payload", "a.%%%.c"],
    ["payload without sub", jwt({ foo: "bar" })],
    ["non-string sub", jwt({ sub: 42 })],
  ])("returns null for %s", (_label, token) => {
    expect(getSessionOwnerId(token)).toBeNull();
  });
});
