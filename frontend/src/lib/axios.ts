import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL;

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
