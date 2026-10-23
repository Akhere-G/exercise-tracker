import {
  completeSet,
  createRoutine,
  editSet,
  expect,
  newAccount,
  register,
  startWorkout,
  test,
} from "./support/app";

test("an active workout survives a page refresh and closing the browser tab", async ({
  page,
  context,
}) => {
  await register(page, newAccount());
  await createRoutine(page, "Leg day", "squat");
  const routineId = await startWorkout(page);

  await editSet(page, 0, "weight", "55");
  await editSet(page, 0, "reps", "6");
  await completeSet(page, 0);
  await expect(page.locator("tbody tr").first()).toHaveClass(/bg-success/);

  // Refresh: progress is restored from localStorage, not reseeded from the routine.
  await page.reload();
  const firstRow = page.locator("tbody tr").first();
  await expect(firstRow).toHaveClass(/bg-success/);
  await expect(firstRow.getByRole("spinbutton").nth(0)).toHaveValue("55");
  await expect(firstRow.getByRole("spinbutton").nth(1)).toHaveValue("6");
  await expect(page.locator("tbody tr").nth(1)).not.toHaveClass(/bg-success/);

  // Close the tab and come back later: the routines page offers to resume.
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto("/routines");
  await expect(reopened.getByText("Leg day").last()).toBeVisible();
  await reopened.goto(`/workouts/active?routineId=${routineId}`);
  const resumedRow = reopened.locator("tbody tr").first();
  await expect(resumedRow).toHaveClass(/bg-success/);
  await expect(resumedRow.getByRole("spinbutton").nth(0)).toHaveValue("55");
});

test("a corrupted saved session does not break the app", async ({ page }) => {
  await register(page, newAccount());
  await createRoutine(page, "Pull day", "pull up");
  await page.evaluate(() => localStorage.setItem("workout-storage", "{not valid json"));

  await page.goto("/routines");
  await expect(page.getByRole("heading", { name: "Pull day" })).toBeVisible();

  const routineId = await startWorkout(page);
  expect(routineId).toBeTruthy();
  await expect(page.locator("tbody tr")).toHaveCount(3);
});
