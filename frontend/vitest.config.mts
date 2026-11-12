import path from "node:path";
import { defineConfig } from "vitest/config";

// A fixed, non-UTC timezone without daylight saving: date and schedule logic is
// exercised with a real offset (+05:30, including a half hour), and results do not
// depend on the machine or the time of year.
process.env.TZ = "Asia/Kolkata";

export default defineConfig({
  resolve: {
    // Mirrors the "@/*" -> "./*" path alias in tsconfig.json.
    alias: { "@": path.resolve(import.meta.dirname) },
  },
  oxc: {
    // The app compiles JSX with React's automatic runtime (tsconfig "jsx": "react-jsx").
    jsx: { runtime: "automatic" },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
    clearMocks: true,
    restoreMocks: true,
    unstubGlobals: true,
    testTimeout: 15_000,
  },
});
