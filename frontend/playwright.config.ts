import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run the real Next.js production build against the real
 * FastAPI backend on a throwaway SQLite database (see e2e/support/run_backend.py).
 * Nothing is mocked except third-party analytics and remote exercise images.
 */
export const BACKEND_PORT = 8765;
const FRONTEND_PORT = 3100;
const frontendUrl = `http://127.0.0.1:${FRONTEND_PORT}`;
export const backendApi = `http://127.0.0.1:${BACKEND_PORT}/api`;

const databaseFile = path.resolve(__dirname, "e2e/.tmp/e2e.db");
const venvPython = path.resolve(__dirname, "../backend/.venv/bin/python");
const python =
  process.env.E2E_PYTHON ??
  (fs.existsSync(venvPython) ? venvPython : "python3");
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Every test creates its own user, so files can run side by side.
  fullyParallel: true,
  workers: isCI ? 2 : undefined,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI
    ? [["github"], ["html", { open: "never" }], ["list"]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: frontendUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    timezoneId: "Europe/London",
    locale: "en-GB",
  },
  // Gains is mobile-first: test the phone layout users actually get.
  projects: [{ name: "mobile-chromium", use: { ...devices["Pixel 7"] } }],
  webServer: [
    {
      command: `"${python}" e2e/support/run_backend.py`,
      url: `http://127.0.0.1:${BACKEND_PORT}/`,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      stdout: "pipe",
      env: {
        DATABASE_URL: `sqlite:///${databaseFile}`,
        SECRET_KEY: "e2e-secret-key-that-is-at-least-32-characters",
        ALGORITHM: "HS256",
        FRONTEND_ORIGIN: frontendUrl,
        E2E_BACKEND_PORT: String(BACKEND_PORT),
      },
    },
    {
      command: `npx next build && npx next start -H 127.0.0.1 -p ${FRONTEND_PORT}`,
      url: frontendUrl,
      reuseExistingServer: !isCI,
      timeout: 300_000,
      env: {
        BASE_URL: backendApi,
        NEXT_PUBLIC_BASE_URL: backendApi,
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  ],
});
