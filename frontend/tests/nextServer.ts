import { vi } from "vitest";

/**
 * In-memory stand-ins for next/headers and next/cache, for code that runs on the
 * Next server (server actions, route handlers, the axios interceptor). Opt in with
 *   vi.mock("next/headers", () => import("@/tests/nextServer"));
 *   vi.mock("next/cache", () => import("@/tests/nextServer"));
 */
export interface StoredCookie {
  value: string;
  options?: Record<string, unknown>;
}

export const cookieJar = new Map<string, StoredCookie>();
export const requestHeaders = new Headers();

export const cookies = async () => ({
  get: (name: string) => {
    const cookie = cookieJar.get(name);
    return cookie ? { name, value: cookie.value } : undefined;
  },
  set: (name: string, value: string, options?: Record<string, unknown>) => {
    cookieJar.set(name, { value, options });
  },
  delete: (name: string) => {
    cookieJar.delete(name);
  },
});

export const headers = async () => requestHeaders;

export const revalidatePath = vi.fn();

export function resetServerState() {
  cookieJar.clear();
  for (const key of [...requestHeaders.keys()]) requestHeaders.delete(key);
}
