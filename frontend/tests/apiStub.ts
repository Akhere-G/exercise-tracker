import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from "axios";
import { api } from "@/src/lib/axios";

export interface RecordedRequest {
  method: string;
  url: string;
  data: unknown;
}

type Reply =
  | { status: number; data?: unknown }
  | { networkError: true };

/**
 * Replaces the axios transport (the real external boundary) with a function so
 * server actions and `handleApiError` run unmodified without touching a network.
 */
export function stubApi(
  handler: (request: RecordedRequest) => Reply,
): RecordedRequest[] {
  const requests: RecordedRequest[] = [];

  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const request: RecordedRequest = {
      method: (config.method ?? "get").toLowerCase(),
      url: config.url ?? "",
      data: typeof config.data === "string" ? JSON.parse(config.data) : config.data,
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
