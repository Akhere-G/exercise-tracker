import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
);
vi.mock("next/navigation", () => ({ redirect }));

import { handleApiError } from "./axios";

function httpError(status: number, data: unknown, authorized = false) {
  const config = {
    headers: new AxiosHeaders(authorized ? { Authorization: "Bearer t" } : {}),
  };
  return new AxiosError("failed", "ERR_BAD_REQUEST", config, undefined, {
    status,
    statusText: "",
    data,
    headers: {},
    config,
  });
}

describe("handleApiError", () => {
  it("reports an unreachable server when there is no response", () => {
    const err = new AxiosError("Network Error", AxiosError.ERR_NETWORK);

    expect(handleApiError(err)).toEqual({
      success: false,
      error: "Could not reach the server. Check your connection.",
    });
  });

  it("surfaces a string detail from the API", () => {
    const result = handleApiError(httpError(409, { detail: "Email taken" }));

    expect(result).toMatchObject({
      success: false,
      error: "Email taken",
      status: 409,
    });
  });

  it("formats the first FastAPI validation error with its field", () => {
    const detail = [
      { loc: ["body", "sets", 0, "reps"], msg: "Value error", type: "value_error", input: 0 },
    ];

    expect(handleApiError(httpError(422, { detail }))).toMatchObject({
      error: "reps: Value error",
      errors: detail,
      status: 422,
    });
  });

  it("falls back to a generic message when the detail is unusable", () => {
    expect(handleApiError(httpError(500, {}))).toMatchObject({
      error: "Something went wrong. Please try again.",
      status: 500,
    });
    expect(handleApiError(httpError(500, { detail: [] }))).toMatchObject({
      error: "Something went wrong. Please try again.",
    });
  });

  it("clears an expired session on 401 when a token was sent", () => {
    expect(() => handleApiError(httpError(401, { detail: "Expired" }, true))).toThrow(
      "NEXT_REDIRECT:/api/session/expired",
    );
  });

  it("does not redirect on 401 for unauthenticated calls such as a bad login", () => {
    redirect.mockClear();

    const result = handleApiError(httpError(401, { detail: "Incorrect email or password" }));

    expect(redirect).not.toHaveBeenCalled();
    expect(result).toMatchObject({ error: "Incorrect email or password", status: 401 });
  });

  it("handles non-axios errors", () => {
    expect(handleApiError(new Error("boom"))).toEqual({
      success: false,
      error: "An unexpected error occurred",
    });
  });
});
