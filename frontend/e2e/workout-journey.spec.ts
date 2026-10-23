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

test("create a routine, log a workout, complete it and see the progress", async ({ page }) => {
  await register(page, newAccount());
  await createRoutine(page, "Push day", "bench press");

  const routineId = await startWorkout(page);
  await editSet(page, 0, "weight", "40");
  await editSet(page, 0, "reps", "5");
  for (const row of [0, 1, 2]) await completeSet(page, row);
  await page.getByRole("button", { name: "Complete Workout" }).click();

  // Summary reflects the logged sets: 40x5 + 2 default sets of 25x10 = 700 kg.
  await expect(page).toHaveURL(/\/workouts\/summary\/\d+/);
  await expect(page.getByText("Workout Complete")).toBeVisible();
  await expect(page.getByText("700 kg", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("3 sets")).toBeVisible();
  await expect(page.getByText("New Max Weight")).toBeVisible();
  await expect(page.getByText("40 kg", { exact: true })).toBeVisible();

  // The in-progress session is gone once the workout is saved.
  expect(await page.evaluate(() => localStorage.getItem("workout-storage"))).toBeNull();

  // Progress: routine stats and the achievements page include the new workout.
  await page.goto(`/routines/${routineId}`);
  await expect(page.getByText("700 kg", { exact: true })).toBeVisible();
  await expect(page.getByText("Workouts", { exact: true })).toBeVisible();

  await page.goto("/achievements");
  await expect(page.getByText("New Max Weight")).toBeVisible();
  await expect(page.getByText("Barbell Bench Press").first()).toBeVisible();
});
