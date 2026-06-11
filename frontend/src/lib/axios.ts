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
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const token = cookieStore.get("access_token")?.value;

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
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
    error: "An unexpected error occured",
  };
}
