import { APIRequestContext, expect, test as base } from "@playwright/test";
import { backendApi } from "../../playwright.config";

// 1x1 transparent PNG so exercise images never reach the remote dataset host.
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

export const PASSWORD = "Password1";

export interface Account {
  username: string;
  email: string;
  password: string;
  token: string;
}

let accountCounter = 0;
export function newCredentials() {
  const id = `${Date.now().toString(36)}${process.pid}${accountCounter++}`;
  return {
    username: `e2e-${id}`,
    email: `e2e-${id}@example.com`,
    password: PASSWORD,
  };
}

/**
 * Talks to the backend directly, as the signed-in user, to arrange data and to
 * check what was actually persisted.
 */
export class BackendApi {
  constructor(
    private readonly request: APIRequestContext,
    readonly token: string,
  ) {}

  private headers() {
    return { Authorization: `Bearer ${this.token}` };
  }

  async get<T>(path: string): Promise<T> {
    const response = await this.request.get(`${backendApi}${path}`, {
      headers: this.headers(),
    });
    expect(response.ok(), `GET ${path} → ${response.status()}`).toBeTruthy();
    return response.json();
  }

  async send<T>(
    method: "post" | "patch" | "put" | "delete",
    path: string,
    data?: unknown,
  ): Promise<T> {
    const response = await this.request.fetch(`${backendApi}${path}`, {
      method: method.toUpperCase(),
      headers: this.headers(),
      data,
    });
    expect(
      response.ok(),
      `${method} ${path} → ${response.status()} ${await response.text()}`,
    ).toBeTruthy();
    return response.json();
  }

  /** Resolves a catalogue exercise by its exact name. */
  async exercise(name: string): Promise<{ id: number; name: string }> {
    const results = await this.get<{ id: number; name: string }[]>(
      `/exercises?search=${encodeURIComponent(name)}&limit=50`,
    );
    const match = results.find(
      (e) => e.name.toLowerCase() === name.toLowerCase(),
    );
    if (!match) throw new Error(`Exercise "${name}" is not in the catalogue`);
    return match;
  }

  /** Logs a completed workout directly, for tests about history and stats. */
  async logWorkout(
    sets: { exerciseId: number; reps: number; weight?: number }[],
    completedAt = new Date(),
  ) {
    return this.send<{ id: number }>("post", "/workouts", {
      completedAt: completedAt.toISOString(),
      duration: 1800,
      sets: sets.map((set, index) => ({
        ...set,
        setIndex: index + 1,
        setType: "normal",
      })),
    });
  }
}

export async function registerAccount(
  request: APIRequestContext,
): Promise<Account> {
  const credentials = newCredentials();
  const response = await request.post(`${backendApi}/auth/register`, {
    data: credentials,
  });
  expect(response.status(), await response.text()).toBe(201);
  const { access_token: token } = await response.json();
  return { ...credentials, token };
}

/** Signs in through the API, as the login page would, and returns a client for that user. */
export async function loginAs(
  request: APIRequestContext,
  email: string,
  password: string,
) {
  const response = await request.post(`${backendApi}/auth/login`, {
    data: { email, password },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const { access_token: token } = await response.json();
  return new BackendApi(request, token);
}

/** A registered user who has finished onboarding but is not signed in to the browser. */
export async function onboardedAccount(
  request: APIRequestContext,
): Promise<Account> {
  const account = await registerAccount(request);
  await new BackendApi(request, account.token).send("patch", "/profile", {
    onboardedAt: new Date().toISOString(),
    timezone: "Europe/London",
  });
  return account;
}

/** Today's date as the app's calendar keys it (local, YYYY-MM-DD). */
export const localDateKey = (date = new Date()) =>
  date.toLocaleDateString("en-CA");

interface Fixtures {
  /** A fresh, onboarded user signed in to the browser. */
  account: Account;
  backend: BackendApi;
}

export const test = base.extend<Fixtures>({
  page: async ({ page }, provide) => {
    await page.route("**/_next/image**", (route) =>
      route.fulfill({ contentType: "image/png", body: PIXEL }),
    );
    // Analytics is proxied to a third party: keep it out of tests.
    await page.route("**/ingest/**", (route) => route.abort());
    // Users who have answered the notifications prompt; it is covered by its own tests.
    await page.addInitScript(() =>
      localStorage.setItem(
        "notifications-prompt-dismissed-at",
        String(Date.now()),
      ),
    );
    await provide(page);
  },
  account: async ({ request, page, baseURL }, provide) => {
    const account = await onboardedAccount(request);
    await page
      .context()
      .addCookies([
        { name: "access_token", value: account.token, url: baseURL! },
      ]);
    await provide(account);
  },
  backend: async ({ request, account }, provide) => {
    await provide(new BackendApi(request, account.token));
  },
});

export { expect };
