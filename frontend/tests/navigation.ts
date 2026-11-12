import { vi } from "vitest";

/**
 * A shared stand-in for next/navigation. Test files opt in with
 *   vi.mock("next/navigation", () => import("@/tests/navigation"));
 * and assert on `router.push` etc. Reset by `restoreMocks` between tests.
 */
export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};
export const useRouter = () => router;
export const usePathname = vi.fn(() => "/");
export const useSearchParams = vi.fn(() => new URLSearchParams());
export const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
export const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
