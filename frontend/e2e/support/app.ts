import { expect, test as base, Page } from "@playwright/test";

// 1x1 transparent PNG, so exercise images never hit the live dataset host.
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.route("**/_next/image**", (route) =>
      route.fulfill({ contentType: "image/png", body: PIXEL }),
    );
    // Keep analytics (proxied to a live PostHog host) out of the run.
    await page.route("**/ingest/**", (route) => route.abort());
    await provide(page);
  },
});
export { expect };

export interface Account {
  username: string;
  email: string;
  password: string;
}

let counter = 0;
export function newAccount(): Account {
  const id = `${Date.now().toString(36)}${counter++}`;
  return {
    username: `e2e-${id}`,
    email: `e2e-${id}@example.com`,
    password: "Password1",
  };
}

export async function register(page: Page, account: Account) {
  await page.goto("/register");
  await page.getByLabel("Username").fill(account.username);
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByLabel("Repeat Password").fill(account.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/routines$/);
}

export async function login(page: Page, account: Account) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/routines$/);
}

/** Opens the exercise picker, searches, and adds the first matching exercise. */
export async function pickExercise(page: Page, search: string, buttonName = "Add") {
  const drawer = page.getByRole("dialog");
  await drawer.getByPlaceholder("Search").fill(search);
  const first = drawer.getByRole("button").filter({ hasText: new RegExp(search, "i") }).first();
  await first.click();
  await drawer.getByRole("button", { name: new RegExp(`^${buttonName}`) }).click();
}

/** Creates a one-exercise routine through the UI and returns its id (read from the Start link flow). */
export async function createRoutine(page: Page, name: string, exercise: string) {
  await page.goto("/routines/create");
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Add Exercise" }).click();
  await pickExercise(page, exercise);
  const inputs = page.getByRole("spinbutton");
  await inputs.nth(0).fill("3"); // sets
  await inputs.nth(1).fill("8"); // reps
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page).toHaveURL(/\/routines$/);
  await expect(page.getByRole("heading", { name })).toBeVisible();
}

/** Starts the routine's workout and returns its id. */
export async function startWorkout(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page).toHaveURL(/\/workouts\/active\?routineId=\d+/);
  await expect(page.locator("tbody tr").first()).toBeVisible();
  return new URL(page.url()).searchParams.get("routineId")!;
}

/** Types a value into a set field and commits it (the inputs commit on blur). */
export async function editSet(page: Page, row: number, field: "weight" | "reps", value: string) {
  const input = page.locator("tbody tr").nth(row).getByRole("spinbutton").nth(field === "weight" ? 0 : 1);
  await input.fill(value);
  await input.press("Enter");
}

export async function completeSet(page: Page, row: number) {
  await page.locator("tbody tr").nth(row).getByRole("button").last().click();
}
