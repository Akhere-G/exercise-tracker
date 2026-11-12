import { expect, test } from "./support/fixtures";

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

test("stats, records and achievements reflect logged workouts", async ({
  page,
  backend,
}) => {
  const bench = await backend.exercise("Barbell Bench Press");
  await backend.logWorkout(
    [{ exerciseId: bench.id, reps: 5, weight: 60 }],
    daysAgo(10),
  );
  await backend.logWorkout(
    [
      { exerciseId: bench.id, reps: 5, weight: 70 },
      { exerciseId: bench.id, reps: 5, weight: 70 },
    ],
    daysAgo(1),
  );

  await page.goto("/stats");
  const overview = page.getByRole("main").or(page.locator("body"));
  // 2 workouts, 3 sets, 300 + 700 kg in the default 30-day range.
  await expect(overview.getByText("1,000 kg").first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: "1. Barbell Bench Press" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Recent personal records" }),
  ).toBeVisible();
  await expect(page.getByText("70 kg").first()).toBeVisible();

  // Narrowing the range is kept in the URL and drops the older workout.
  await page.getByRole("link", { name: "7 days" }).click();
  await expect(page).toHaveURL(/range=7d/);
  await expect(page.getByText("700 kg").first()).toBeVisible();

  await page.getByRole("link", { name: "Achievements" }).click();
  await expect(page.getByText("New Max Weight", { exact: true })).toBeVisible();
  await expect(page.getByText("70 kg").first()).toBeVisible();
  await expect(page.getByText("First Workout", { exact: true })).toBeVisible();
});

test("a new user sees empty states rather than errors", async ({
  page,
  account,
}) => {
  expect(account.email).toContain("@");
  await page.goto("/stats");
  await expect(page.getByRole("heading", { name: "Stats" })).toBeVisible();
  await expect(page.getByText("No workouts in this period")).toBeVisible();

  await page.goto("/workouts");
  await expect(page.getByRole("link", { name: /^Workout on/ })).toHaveCount(0);

  await page.goto("/body");
  await expect(page.getByText("No weigh-ins yet.")).toBeVisible();
});
