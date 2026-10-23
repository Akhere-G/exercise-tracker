import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const BACKEND_PORT = 8765;
const FRONTEND_PORT = 3100;
const frontendUrl = `http://127.0.0.1:${FRONTEND_PORT}`;
const backendApi = `http://127.0.0.1:${BACKEND_PORT}/api`;

const dbFile = path.resolve(__dirname, "e2e/.tmp/e2e.db");
const venvPython = path.resolve(__dirname, "../backend/.venv/bin/python");
const python =
  process.env.E2E_PYTHON ?? (fs.existsSync(venvPython) ? venvPython : "python3");

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: frontendUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Pixel 7"] } }],
  webServer: [
    {
      // Throwaway SQLite database + the real FastAPI app (see e2e/support/run_backend.py).
      command: `"${python}" e2e/support/run_backend.py`,
      url: `http://127.0.0.1:${BACKEND_PORT}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        DATABASE_URL: `sqlite:///${dbFile}`,
        SECRET_KEY: "e2e-secret-key-that-is-at-least-32-characters",
        ALGORITHM: "HS256",
        FRONTEND_ORIGIN: frontendUrl,
        E2E_BACKEND_PORT: String(BACKEND_PORT),
        DEMO_MODE_ENABLED: "false",
        // Empty values override anything in the developer's backend/.env.
        REDIS_URL: "",
        VAPID_PRIVATE_KEY: "",
      },
    },
    {
      // Production build in its own folder so a running `next dev` is left alone.
      command: `npx next build && npx next start -H 127.0.0.1 -p ${FRONTEND_PORT}`,
      url: frontendUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      env: {
        NEXT_DIST_DIR: ".next-e2e",
        BASE_URL: backendApi,
        NEXT_PUBLIC_BASE_URL: backendApi,
      },
    },
  ],
});
