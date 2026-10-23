// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

function request(path: string, token?: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: token ? { cookie: `access_token=${token}` } : {},
  });
}

function redirectTarget(path: string, token?: string) {
  const response = proxy(request(path, token));
  const location = response.headers.get("location");
  return location ? new URL(location) : null;
}

describe("proxy (route protection)", () => {
  it.each([
    "/routines",
    "/routines/create",
    "/routines/12",
    "/workouts/active",
    "/workouts/summary/3",
    "/exercises/5",
    "/achievements",
    "/settings",
  ])("sends signed-out visitors from %s to login", (path) => {
    const target = redirectTarget(path);

    expect(target?.pathname).toBe("/login");
    expect(target?.searchParams.get("callbackUrl")).toBe(path);
  });

  it("lets signed-in users reach protected pages", () => {
    expect(redirectTarget("/routines", "jwt")).toBeNull();
    expect(redirectTarget("/workouts/active", "jwt")).toBeNull();
  });

  it("keeps public pages open", () => {
    expect(redirectTarget("/")).toBeNull();
    expect(redirectTarget("/login")).toBeNull();
    expect(redirectTarget("/register")).toBeNull();
    expect(redirectTarget("/demo")).toBeNull();
  });

  it.each(["/login", "/register"])("moves signed-in users off %s", (path) => {
    expect(redirectTarget(path, "jwt")?.pathname).toBe("/routines");
  });

  it("does not treat lookalike paths as protected", () => {
    expect(redirectTarget("/routines-info")).toBeNull();
  });
});
