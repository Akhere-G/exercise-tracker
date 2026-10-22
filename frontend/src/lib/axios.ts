import axios, { isAxiosError } from "axios";
import { ActionResponse } from "./apiTypes";

const baseURL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.BASE_URL ||
  "https://exercise-tracker-backend-752853711822.europe-west2.run.app/api";

export const api = axios.create({
  withCredentials: true,
  baseURL,
});

api.interceptors.request.use(async (config) => {
  if (typeof window === "undefined") {
    try {
      const { cookies, headers } = await import("next/headers");
      const cookieStore = await cookies();
      const token = cookieStore.get("access_token")?.value;

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // This server calls the API on behalf of the browser, so pass on the
      // caller's address for the backend's per-client rate limits (it trusts
      // this header when TRUSTED_PROXY_COUNT is set). Only the last entry is
      // used: that is the one added by our own proxy, earlier ones come from
      // the client and can be forged.
      const forwardedFor = (await headers()).get("x-forwarded-for");
      const clientIp = forwardedFor
        ?.split(",")
        .map((hop) => hop.trim())
        .filter(Boolean)
        .at(-1);
      if (clientIp && config.headers) {
        config.headers["X-Forwarded-For"] = clientIp;
      }
    } catch {
      console.warn("Skipped server-side cookie parsing.");
    }
  }
  return config;
});

export function handleApiError<T>(err: unknown): ActionResponse<T> {
  if (isAxiosError(err)) {
    return {
      success: false,
      errors: err.response?.data.detail,
    };
  }
  return {
    success: false,
    error: "An unexpected error occurred",
  };
}
