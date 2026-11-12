// @vitest-environment node
import { AxiosError, AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { stubApi } from "@/tests/apiStub";
import {
  cookieJar,
  requestHeaders,
  resetServerState,
} from "@/tests/nextServer";

vi.mock("next/headers", () => import("@/tests/nextServer"));
vi.mock("next/navigation", () => import("@/tests/navigation"));

import { redirect } from "next/navigation";
import { api, handleApiError } from "./axios";

describe("handleApiError", () => {
  const httpError = (status: number, detail: unknown, withAuth = false) => {
    const headers = new AxiosHeaders();
    if (withAuth) headers.set("Authorization", "Bearer abc");
    return new AxiosError("failed", "ERR_BAD_REQUEST", { headers }, undefined, {
      status,
      statusText: "",
      data: { detail },
      headers: {},
      config: { headers },
    });
  };

  it("sends an expired session to re-authenticate", () => {
    expect(() => handleApiError(httpError(401, "Expired", true))).toThrow(
      "NEXT_REDIRECT:/api/session/expired",
    );
  });

  it("treats a 401 without credentials (wrong password) as an ordinary error", () => {
    expect(
      handleApiError(httpError(401, "Incorrect email or password")),
    ).toEqual({
      success: false,
      error: "Incorrect email or password",
      errors: "Incorrect email or password",
      status: 401,
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("explains FastAPI validation errors by field", () => {
    const detail = [
      {
        loc: ["body", "password"],
        msg: "too short",
        type: "value_error",
        input: "",
      },
    ];
    expect(handleApiError(httpError(422, detail))).toMatchObject({
      error: "password: too short",
      errors: detail,
      status: 422,
    });
  });

  it("falls back to a generic message for unexpected payloads", () => {
    expect(handleApiError(httpError(500, { weird: true }))).toMatchObject({
      error: "Something went wrong. Please try again.",
    });
  });

  it("distinguishes network failures and non-HTTP errors", () => {
    expect(
      handleApiError(new AxiosError("Network Error", "ERR_NETWORK")),
    ).toEqual({
      success: false,
      error: "Could not reach the server. Check your connection.",
    });
    expect(handleApiError(new Error("boom"))).toEqual({
      success: false,
      error: "An unexpected error occurred",
    });
  });
});

describe("server-side request interceptor", () => {
  beforeEach(resetServerState);

  it("attaches the session token and the caller's IP", async () => {
    cookieJar.set("access_token", { value: "abc" });
    requestHeaders.set("x-forwarded-for", "spoofed, 203.0.113.9");
    const requests = stubApi();

    await api.get("/routines");

    // Only the last hop (added by our own proxy) is trusted.
    expect(requests[0].authorization).toBe("Bearer abc");
    expect(requests[0].forwardedFor).toBe("203.0.113.9");
  });

  it.each(["/auth/login", "/auth/register", "/auth/demo", "/auth/token"])(
    "never sends a stale token to %s",
    async (url) => {
      cookieJar.set("access_token", { value: "stale" });
      const requests = stubApi();
      await api.post(url);
      expect(requests[0].authorization).toBeUndefined();
    },
  );
});
