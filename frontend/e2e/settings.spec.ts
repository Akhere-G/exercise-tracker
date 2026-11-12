import { readFile } from "node:fs/promises";
import { expect, test } from "./support/fixtures";

test("switching to pounds changes how weights are shown, not what is stored", async ({
  page,
  backend,
}) => {
  const bench = await backend.exercise("Barbell Bench Press");
  const workout = await backend.logWorkout([
    { exerciseId: bench.id, reps: 5, weight: 100 },
  ]);

  await page.goto("/settings");
  await page.getByLabel("Weight unit").selectOption("lb");
  await expect
    .poll(
      async () =>
        (await backend.get<{ weightUnit: string }>("/profile")).weightUnit,
    )
    .toBe("lb");

  await page.goto(`/workouts/summary/${workout.id}`);
  await expect(page.getByText("1,102.3 lb").first()).toBeVisible();

  const saved = await backend.get<{ sets: { weight: number }[] }>(
    `/workouts/${workout.id}`,
  );
  expect(saved.sets[0].weight).toBe(100);
});

test("goals and body weight are saved", async ({ page, backend }) => {
  await page.goto("/settings");
  await page.getByLabel("Workouts per week").fill("4");
  await page.getByLabel("Target body weight (kg)").fill("75");
  await page.getByLabel("Target body weight (kg)").blur();
  await expect
    .poll(async () => backend.get<Record<string, unknown>>("/profile"))
    .toMatchObject({ workoutsPerWeekTarget: 4, targetBodyWeightKg: 75 });

  await page.reload();
  await expect(page.getByLabel("Workouts per week")).toHaveValue("4");

  await page.goto("/body");
  await page.getByLabel("Weight (kg)").fill("80.5");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(
    page.getByRole("listitem").filter({ hasText: "80.5 kg" }),
  ).toBeVisible();
  const [entry] = await backend.get<{ weightKg: number }[]>("/body/weights");
  expect(entry.weightKg).toBe(80.5);

  await page.getByRole("button", { name: /^Delete weigh-in on/ }).click();
  await expect(page.getByText("No weigh-ins yet.")).toBeVisible();
  expect(await backend.get<unknown[]>("/body/weights")).toEqual([]);
});

test("workout history exports as CSV", async ({ page, backend }) => {
  const bench = await backend.exercise("Barbell Bench Press");
  await backend.logWorkout([{ exerciseId: bench.id, reps: 5, weight: 100 }]);

  await page.goto("/settings");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export History (.csv)" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("gains-workouts.csv");
  const csv = await readFile((await download.path())!, "utf8");
  expect(csv).toContain("Barbell Bench Press");
  expect(csv.trim().split("\n")).toHaveLength(2);
});
