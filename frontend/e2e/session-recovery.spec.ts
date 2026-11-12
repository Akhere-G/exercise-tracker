import { expect, test } from "./support/fixtures";

test.beforeEach(async ({ backend }) => {
  const bench = await backend.exercise("Barbell Bench Press");
  await backend.send("post", "/routines", {
    name: "Push day",
    day: 0,
    startTime: "06:00:00Z",
    routineItems: [
      { exerciseId: bench.id, targetSets: 2, targetReps: 5, order: 0 },
    ],
  });
});

test("a workout in progress survives a reload and can be resumed from routines", async ({
  page,
}) => {
  await page.goto("/routines");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  const weight = page.getByRole("spinbutton", { name: "Set 1 weight" });
  await weight.fill("77.5");
  await weight.press("Enter");
  await page.getByRole("button", { name: "Complete set" }).first().click();

  await page.reload();
  await expect(
    page.getByRole("spinbutton", { name: "Set 1 weight" }),
  ).toHaveValue("77.5");
  await expect(
    page.getByRole("button", { name: "Mark set incomplete" }),
  ).toBeVisible();

  await page.goto("/routines");
  await page.getByRole("button", { name: "Resume workout: Push day" }).click();
  await expect(page).toHaveURL(/\/workouts\/active\?routineId=\d+$/);
  await expect(
    page.getByRole("spinbutton", { name: "Set 1 weight" }),
  ).toHaveValue("77.5");

  // Starting the routine again asks before throwing the workout away.
  await page.goto("/routines");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "You have a workout in progress" }),
  ).toBeVisible();
});

test("cancelling a workout discards it", async ({ page, backend }) => {
  await page.goto("/routines");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("button", { name: "Exercise options" }).click();
  await page.getByRole("menuitem", { name: "Cancel Workout" }).click();
  await page
    .getByRole("dialog", { name: "Cancel workout?" })
    .getByRole("button", { name: "Cancel Workout" })
    .click();

  await expect(page).toHaveURL(/\/routines$/);
  expect(
    await page.evaluate(() => localStorage.getItem("workout-storage") ?? ""),
  ).not.toContain("Bench");
  // Nothing was saved and starting again needs no confirmation.
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page).toHaveURL(/\/workouts\/active/);
  expect(await backend.get<unknown[]>("/workouts")).toEqual([]);
});

test("corrupt saved workout data does not break the app", async ({ page }) => {
  await page.goto("/routines");
  await page.evaluate(() =>
    localStorage.setItem("workout-storage", "{not valid json"),
  );

  await page.getByRole("button", { name: "Start", exact: true }).click();

  await expect(
    page.getByRole("heading", { name: "Barbell Bench Press" }),
  ).toBeVisible();
  await expect(
    page.getByRole("spinbutton", { name: "Set 1 reps" }),
  ).toHaveValue("5");
});
