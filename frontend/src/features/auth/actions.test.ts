// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { stubApi } from "@/tests/apiStub";
import { cookieJar, resetServerState } from "@/tests/nextServer";

vi.mock("next/headers", () => import("@/tests/nextServer"));
vi.mock("next/navigation", () => import("@/tests/navigation"));

import {
  demoLoginAction,
  loginAction,
  logoutAction,
  registerAction,
} from "./actions";

const token = { access_token: "jwt-123", token_type: "bearer" };

describe("auth actions", () => {
  beforeEach(resetServerState);

  it("logs in and stores the token in an httpOnly cookie for a week", async () => {
    const requests = stubApi(() => ({ status: 200, data: token }));

    const result = await loginAction({
      email: "sam@example.com",
      password: "Password1",
    });

    expect(result).toEqual({ success: true, data: null });
    expect(requests[0]).toMatchObject({
      method: "post",
      url: "/auth/login",
      data: { email: "sam@example.com", password: "Password1" },
    });
    expect(cookieJar.get("access_token")).toEqual({
      value: "jwt-123",
      options: expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 604800,
      }),
    });
  });

  it("reports bad credentials without setting a cookie", async () => {
    stubApi(() => ({
      status: 401,
      data: { detail: "Incorrect email or password" },
    }));

    const result = await loginAction({
      email: "sam@example.com",
      password: "wrong-pass",
    });

    expect(result).toMatchObject({
      success: false,
      error: "Incorrect email or password",
    });
    expect(cookieJar.has("access_token")).toBe(false);
  });

  it("registers and signs the new user in", async () => {
    stubApi(() => ({ status: 201, data: token }));
    const result = await registerAction({
      username: "sam",
      email: "sam@example.com",
      password: "Password1",
      repeatPassword: "Password1",
    });
    expect(result.success).toBe(true);
    expect(cookieJar.get("access_token")?.value).toBe("jwt-123");
  });

  it("starts a two-hour demo session flagged as a demo", async () => {
    stubApi(() => ({ status: 200, data: token }));

    await demoLoginAction();

    expect(cookieJar.get("access_token")?.options).toMatchObject({
      maxAge: 7200,
    });
    expect(cookieJar.get("demo_session")).toMatchObject({ value: "1" });
  });

  it("reports an unavailable demo", async () => {
    stubApi(() => ({ status: 503, data: { detail: "Demo unavailable" } }));
    expect(await demoLoginAction()).toMatchObject({
      success: false,
      status: 503,
    });
  });

  it("logs out by clearing both cookies and going home", async () => {
    cookieJar.set("access_token", { value: "jwt" });
    cookieJar.set("demo_session", { value: "1" });

    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT:/");
    expect(cookieJar.size).toBe(0);
  });
});
