import axios, { isAxiosError } from "axios";
import { redirect } from "next/navigation";
import { ActionResponse, ValidationError } from "./apiTypes";

const baseURL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.BASE_URL ||
  "https://exercise-tracker-backend-752853711822.europe-west2.run.app/api";

export const api = axios.create({
  withCredentials: true,
  baseURL,
});

// Credential endpoints are called without a session, so never attach a
// (possibly stale) token to them.
const PUBLIC_AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/demo",
  "/auth/token",
];

api.interceptors.request.use(async (config) => {
  if (typeof window === "undefined") {
    try {
      const { cookies, headers } = await import("next/headers");
      const cookieStore = await cookies();
      const token = cookieStore.get("access_token")?.value;

      const isPublicAuthCall = PUBLIC_AUTH_PATHS.some((path) =>
        config.url?.startsWith(path),
      );
      if (token && config.headers && !isPublicAuthCall) {
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

const FALLBACK_ERROR = "Something went wrong. Please try again.";

function describeApiError(detail: unknown): string {
  if (typeof detail === "string" && detail) return detail;

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as Partial<ValidationError>;
    if (typeof first?.msg === "string") {
      const field = first.loc?.at(-1);
      return typeof field === "string" ? `${field}: ${first.msg}` : first.msg;
    }
  }

  return FALLBACK_ERROR;
}

export function handleApiError<T>(err: unknown): ActionResponse<T> {
  // The API rejected our session token (expired, or signed with another key).
  // Cookies cannot be changed from a Server Component, so hand over to a route
  // that clears them and returns to the login page.
  if (
    isAxiosError(err) &&
    err.response?.status === 401 &&
    err.config?.headers?.has("Authorization")
  ) {
    redirect("/api/session/expired");
  }

  if (isAxiosError(err)) {
    if (!err.response) {
      return {
        success: false,
        error: "Could not reach the server. Check your connection.",
      };
    }

    const detail: unknown = err.response.data?.detail;
    return {
      success: false,
      error: describeApiError(detail),
      errors: detail as ValidationError[] | string | undefined,
      status: err.response.status,
    };
  }
  return {
    success: false,
    error: "An unexpected error occurred",
  };
}
