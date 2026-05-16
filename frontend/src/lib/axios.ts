import axios from "axios";
import { cookies } from "next/headers";

const baseURL = process.env.BASE_URL;

export const api = axios.create({
  withCredentials: true,
  baseURL,
});

api.interceptors.request.use(async (config) => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    console.warn(
      "Axios interceptor skipped cookie extraction outside request context.",
    );
  }

  return config;
});
