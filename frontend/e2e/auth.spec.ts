import { expect, login, newAccount, register, test } from "./support/app";

test("protected pages require sign-in, and signed-in users are kept off the auth pages", async ({
  page,
  context,
}) => {
  await page.goto("/routines");
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Froutines/);

  const account = newAccount();
  await register(page, account);
  await expect(page.getByRole("heading", { name: "Routines", exact: true })).toBeVisible();

  // Signed-in users are kept off the auth pages.
  await page.goto("/login");
  await expect(page).toHaveURL(/\/routines$/);

  await context.clearCookies();
  await page.goto("/routines");
  await expect(page).toHaveURL(/\/login/);

  await login(page, account);
});

test("wrong credentials show an error and keep the visitor signed out", async ({ page }) => {
  const account = newAccount();
  await register(page, account);
  await page.context().clearCookies();

  await page.goto("/login");
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill("WrongPassword1");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByText(/incorrect|invalid/i)).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});
