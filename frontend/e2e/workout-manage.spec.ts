import { expect, test } from "./support/fixtures";

test("editing a logged workout updates its stored sets", async ({
  page,
  backend,
}) => {
  const bench = await backend.exercise("Barbell Bench Press");
  const workout = await backend.logWorkout([
    { exerciseId: bench.id, reps: 5, weight: 60 },
    { exerciseId: bench.id, reps: 5, weight: 60 },
  ]);

  await page.goto(`/workouts/summary/${workout.id}`);
  await expect(page.getByText("600 kg").first()).toBeVisible();
  await page.getByRole("link", { name: "Edit" }).click();

  const section = page.getByRole("group", { name: "Barbell Bench Press" });
  const weight = section.getByRole("spinbutton", { name: "Set 2 weight" });
  await weight.fill("70");
  await weight.press("Enter");
  await section.getByRole("button", { name: "Add Set" }).click();
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page).toHaveURL(new RegExp(`/workouts/summary/${workout.id}$`));
  // 5×60 + 5×70 + the added default set of 10×25.
  await expect(page.getByText("900 kg").first()).toBeVisible();

  const saved = await backend.get<{ sets: { weight: number; reps: number }[] }>(
    `/workouts/${workout.id}`,
  );
  expect(saved.sets.map((s) => [s.reps, s.weight])).toEqual([
    [5, 60],
    [5, 70],
    [10, 25],
  ]);
});

test("deleting a workout removes it from history", async ({
  page,
  backend,
}) => {
  const bench = await backend.exercise("Barbell Bench Press");
  const workout = await backend.logWorkout([
    { exerciseId: bench.id, reps: 5, weight: 60 },
  ]);

  await page.goto(`/workouts/summary/${workout.id}`);
  await page.getByRole("button", { name: "Delete" }).click();
  await page
    .getByRole("dialog", { name: "Delete Workout?" })
    .getByRole("button", { name: "Delete" })
    .click();

  await expect(page).toHaveURL(/\/workouts$/);
  await expect(page.getByRole("link", { name: /^Workout on/ })).toHaveCount(0);
  expect(await backend.get<unknown[]>("/workouts")).toEqual([]);
});
