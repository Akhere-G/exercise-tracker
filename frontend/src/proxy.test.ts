// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

const request = (path: string, token?: string) => {
  const req = new NextRequest(new URL(path, "http://localhost:3000"));
  if (token) req.cookies.set("access_token", token);
  return req;
};

const location = (res: Response) => res.headers.get("location");

describe("route protection", () => {
  it.each([
    "/routines",
    "/workouts/active",
    "/stats",
    "/settings",
    "/onboarding",
    "/exercises/12",
  ])(
    "sends signed-out visitors from %s to login, remembering where they were",
    (path) => {
      const res = proxy(request(path));
      expect(location(res)).toBe(
        `http://localhost:3000/login?callbackUrl=${encodeURIComponent(path)}`,
      );
    },
  );

  it("lets signed-in users through", () => {
    expect(location(proxy(request("/routines", "token")))).toBeNull();
  });

  it("does not protect look-alike or public paths", () => {
    expect(location(proxy(request("/routinesx")))).toBeNull();
    expect(location(proxy(request("/")))).toBeNull();
    expect(location(proxy(request("/demo")))).toBeNull();
  });

  it("bounces signed-in users away from login and register", () => {
    expect(location(proxy(request("/login", "token")))).toBe(
      "http://localhost:3000/routines",
    );
    expect(location(proxy(request("/register", "token")))).toBe(
      "http://localhost:3000/routines",
    );
    expect(location(proxy(request("/login")))).toBeNull();
  });
});
