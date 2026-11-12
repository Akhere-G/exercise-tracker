import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from "axios";
import { afterEach } from "vitest";
import { api } from "@/src/lib/axios";

export interface RecordedRequest {
  method: string;
  url: string;
  params: Record<string, unknown> | undefined;
  data: unknown;
  authorization: string | undefined;
  forwardedFor: string | undefined;
}

export type Reply = { status: number; data?: unknown } | { networkError: true };

const originalAdapter = api.defaults.adapter;

/**
 * Replaces the axios transport (the real external boundary) with a handler, so
 * server actions, interceptors and `handleApiError` run unmodified with no network.
 * Requests are recorded for assertions.
 */
export function stubApi(
  handler: (request: RecordedRequest) => Reply = () => ({
    status: 200,
    data: {},
  }),
): RecordedRequest[] {
  const requests: RecordedRequest[] = [];

  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const request: RecordedRequest = {
      method: (config.method ?? "get").toLowerCase(),
      url: config.url ?? "",
      params: config.params,
      data:
        typeof config.data === "string" ? JSON.parse(config.data) : config.data,
      authorization: AxiosHeaders.from(config.headers)
        .get("Authorization")
        ?.toString(),
      forwardedFor: AxiosHeaders.from(config.headers)
        .get("X-Forwarded-For")
        ?.toString(),
    };
    requests.push(request);

    const reply = handler(request);
    if ("networkError" in reply) {
      throw new AxiosError("Network Error", AxiosError.ERR_NETWORK, config);
    }

    const response = {
      status: reply.status,
      statusText: "",
      data: reply.data,
      headers: new AxiosHeaders(),
      config,
    };
    if (reply.status >= 400) {
      throw new AxiosError(
        `Request failed with status code ${reply.status}`,
        AxiosError.ERR_BAD_REQUEST,
        config,
        undefined,
        response,
      );
    }
    return response;
  };

  return requests;
}

afterEach(() => {
  api.defaults.adapter = originalAdapter;
});
