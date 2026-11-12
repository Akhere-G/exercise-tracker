import { backendApi } from "../playwright.config";
import {
  expect,
  loginAs,
  newCredentials,
  onboardedAccount,
  test,
} from "./support/fixtures";

test.describe("accounts", () => {
  test("a new user registers, onboards in pounds and lands on their routines", async ({
    page,
    request,
  }) => {
    const credentials = newCredentials();

    await page.goto("/register");
    await page.getByLabel("Username").fill(credentials.username);
    await page.getByLabel("Email").fill(credentials.email);
    await page
      .getByLabel("Password", { exact: true })
      .fill(credentials.password);
    await page.getByLabel("Repeat Password").fill(credentials.password);
    await page.getByRole("button", { name: "Create account" }).click();

    // New users are taken through onboarding before the dashboard.
    await expect(page).toHaveURL(/\/onboarding$/);
    await page.getByRole("button", { name: /Build muscle/ }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: /Beginner/ }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: /3 days/ }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "lb", exact: true }).click();
    await page.getByLabel("Body weight (lb, optional)").fill("180");
    await page.getByRole("button", { name: /Prefer not to say/ }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: /Drill Sergeant/ }).click();
    await page.getByRole("button", { name: "Finish" }).click();

    await expect(page).toHaveURL(/\/routines$/);
    await expect(
      page.getByRole("heading", { name: "Routines", exact: true }),
    ).toBeVisible();

    // The answers were saved, with body weight converted to kg.
    const backend = await loginAs(
      request,
      credentials.email,
      credentials.password,
    );
    const profile = await backend.get<Record<string, unknown>>("/profile");
    expect(profile).toMatchObject({
      weightUnit: "lb",
      goal: "hypertrophy",
      experience: "beginner",
      workoutsPerWeekTarget: 3,
      coachPersona: "drill",
      onboardedAt: expect.any(String),
    });
    const weights = await backend.get<{ weightKg: number }[]>("/body/weights");
    expect(weights.map((w) => w.weightKg)).toEqual([81.647]);
  });

  test("registering an email twice explains the problem", async ({
    page,
    request,
  }) => {
    const existing = await onboardedAccount(request);

    await page.goto("/register");
    await page.getByLabel("Username").fill("someone-else");
    await page.getByLabel("Email").fill(existing.email);
    await page.getByLabel("Password", { exact: true }).fill("Password1");
    await page.getByLabel("Repeat Password").fill("Password1");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "A user with this email address already exists." }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test("protected pages need a session, and logging out ends it", async ({
    page,
    request,
  }) => {
    const account = await onboardedAccount(request);

    await page.goto("/stats");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fstats$/);

    await page.getByLabel("Email").fill(account.email);
    await page.getByLabel("Password").fill("WrongPassword1");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Incorrect password or email" }),
    ).toBeVisible();

    // Emails are matched case-insensitively.
    await page.getByLabel("Email").fill(account.email.toUpperCase());
    await page.getByLabel("Password").fill(account.password);
    await page.getByRole("button", { name: "Login" }).click();
    await expect(
      page.getByRole("heading", { name: "Routines", exact: true }),
    ).toBeVisible();

    // Signed-in users skip the auth pages.
    await page.goto("/login");
    await expect(page).toHaveURL(/\/routines$/);

    await page.getByRole("link", { name: "Settings" }).click();
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/routines");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Froutines$/);
  });

  test("an expired session sends the user back to login", async ({
    page,
    baseURL,
  }) => {
    await page
      .context()
      .addCookies([
        { name: "access_token", value: "not-a-valid-token", url: baseURL! },
      ]);

    await page.goto("/routines");

    await expect(page).toHaveURL(/\/login$/);
    expect(
      (await page.context().cookies()).find((c) => c.name === "access_token"),
    ).toBeUndefined();
  });

  test("anyone can try the demo account", async ({ page, request }) => {
    expect((await request.post(`${backendApi}/auth/demo`)).ok()).toBeTruthy();

    await page.goto("/login");
    await page.getByRole("button", { name: "Try demo" }).click();

    await expect(page).toHaveURL(/\/routines$/);
    await expect(
      page.getByText("You're exploring a demo. Changes reset regularly."),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Push Day" })).toBeVisible();
  });
});
