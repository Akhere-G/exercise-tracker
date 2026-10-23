import { beforeEach, describe, expect, it, vi } from "vitest";
import { stubApi } from "@/tests/apiStub";

const cookieStore = vi.hoisted(() => ({ set: vi.fn(), delete: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
  headers: async () => new Headers(),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

import { demoLoginAction, loginAction, logoutAction } from "./actions";

const credentials = { email: "a@example.com", password: "Password1" };

beforeEach(() => {
  cookieStore.set.mockClear();
  cookieStore.delete.mockClear();
});

describe("loginAction", () => {
  it("stores the token in an httpOnly cookie on success", async () => {
    const requests = stubApi(() => ({
      status: 200,
      data: { access_token: "jwt-token", token_type: "bearer" },
    }));

    expect(await loginAction(credentials)).toEqual({ success: true, data: null });

    expect(requests[0]).toMatchObject({ method: "post", url: "/auth/login", data: credentials });
    expect(cookieStore.set).toHaveBeenCalledWith(
      "access_token",
      "jwt-token",
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/", maxAge: 604800 }),
    );
  });

  it("sets no cookie when credentials are rejected", async () => {
    stubApi(() => ({ status: 401, data: { detail: "Incorrect email or password" } }));

    expect(await loginAction(credentials)).toMatchObject({
      success: false,
      error: "Incorrect email or password",
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("sets no cookie when the server is unreachable", async () => {
    stubApi(() => ({ networkError: true }));

    expect(await loginAction(credentials)).toMatchObject({ success: false });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });
});

describe("demoLoginAction", () => {
  it("creates a short-lived demo session", async () => {
    stubApi(() => ({ status: 200, data: { access_token: "demo-jwt", token_type: "bearer" } }));

    await demoLoginAction();

    expect(cookieStore.set).toHaveBeenCalledWith(
      "access_token",
      "demo-jwt",
      expect.objectContaining({ maxAge: 7200 }),
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      "demo_session",
      "1",
      expect.objectContaining({ maxAge: 7200 }),
    );
  });

  it("reports demo mode being disabled", async () => {
    stubApi(() => ({ status: 404, data: { detail: "Not Found" } }));

    expect(await demoLoginAction()).toMatchObject({ success: false, status: 404 });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });
});

describe("logoutAction", () => {
  it("clears both cookies and redirects home", async () => {
    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT:/");

    expect(cookieStore.delete).toHaveBeenCalledWith("access_token");
    expect(cookieStore.delete).toHaveBeenCalledWith("demo_session");
  });
});
