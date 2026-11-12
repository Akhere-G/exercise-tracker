import { expect, localDateKey, test } from "./support/fixtures";

interface SavedWorkout {
  id: number;
  routineId: number | null;
  duration: number;
  sets: {
    exerciseId: number;
    setIndex: number;
    reps: number;
    weight: number;
  }[];
}

test("plan a routine, train it, and see the results everywhere", async ({
  page,
  backend,
}) => {
  const bench = await backend.exercise("Barbell Bench Press");

  // 1. Create a routine through the UI.
  await page.goto("/routines/create");
  await page.getByLabel("Name").fill("Push day");
  await page.getByRole("button", { name: "Add Exercise" }).click();
  const picker = page.getByRole("dialog");
  await picker
    .getByRole("textbox", { name: "Search exercises" })
    .fill("barbell bench press");
  await picker.getByRole("button", { name: /^Barbell Bench Press/ }).click();
  await picker.getByRole("button", { name: "Add (1)" }).click();
  const benchCard = page.getByRole("group", { name: "Barbell Bench Press" });
  await benchCard.getByLabel("Sets").fill("2");
  await benchCard.getByLabel("Reps").fill("5");
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page).toHaveURL(/\/routines$/);
  await expect(page.getByRole("heading", { name: "Push day" })).toBeVisible();
  const [routine] =
    await backend.get<
      {
        id: number;
        routineItems: {
          exerciseId: number;
          targetSets: number;
          targetReps: number;
        }[];
      }[]
    >("/routines");
  expect(routine.routineItems).toEqual([
    expect.objectContaining({
      exerciseId: bench.id,
      targetSets: 2,
      targetReps: 5,
    }),
  ]);

  // 2. Train it: log weights, complete both sets, finish.
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`/workouts/active\\?routineId=${routine.id}$`),
  );
  await expect(
    page.getByRole("heading", { name: "Barbell Bench Press" }),
  ).toBeVisible();
  for (const set of [1, 2]) {
    const weight = page.getByRole("spinbutton", { name: `Set ${set} weight` });
    await weight.fill("60");
    await weight.press("Enter");
  }
  await page.getByRole("button", { name: "Complete set" }).first().click();
  // A rest timer starts between sets.
  await expect(page.getByRole("button", { name: "+ 15" })).toBeVisible();
  await page.getByRole("button", { name: "Complete set" }).click();
  await page.getByRole("button", { name: "Complete Workout" }).click();

  // 3. The summary reflects the workout and the new personal record.
  await expect(page).toHaveURL(/\/workouts\/summary\/\d+\?first=true$/);
  const workoutId = Number(new URL(page.url()).pathname.split("/").at(-1));
  await expect(page.getByText("600 kg").first()).toBeVisible();
  await expect(page.getByText("New Max Weight", { exact: true })).toBeVisible();
  await expect(page.getByText("60 kg").first()).toBeVisible();

  const saved = await backend.get<SavedWorkout>(`/workouts/${workoutId}`);
  expect(saved.routineId).toBe(routine.id);
  expect(saved.sets.map((s) => [s.exerciseId, s.reps, s.weight])).toEqual([
    [bench.id, 5, 60],
    [bench.id, 5, 60],
  ]);
  expect(saved.duration).toBeLessThan(600);

  // 4. History shows it on today's date.
  await page.getByRole("link", { name: "Workout history" }).click();
  await page
    .getByRole("link", { name: `Workout on ${localDateKey()}` })
    .click();
  await expect(page).toHaveURL(new RegExp(`/workouts/summary/${workoutId}$`));

  // 5. Training the routine again starts from last session's weights.
  await page.getByRole("link", { name: "Routines" }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(
    page.getByRole("spinbutton", { name: "Set 1 weight" }),
  ).toHaveValue("60");
  await expect(
    page.getByRole("button", { name: "Use last session's 60×5" }).first(),
  ).toBeVisible();
});

test("a workout without a routine records its real duration and can become a routine", async ({
  page,
  backend,
}) => {
  await page.goto("/routines");
  await page.getByRole("button", { name: "Start Empty Workout" }).click();
  await expect(page).toHaveURL(/\/workouts\/active$/);
  await expect(
    page.getByRole("heading", { name: "No exercises" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Add Exercise" }).click();
  const picker = page.getByRole("dialog");
  await picker
    .getByRole("textbox", { name: "Search exercises" })
    .fill("push-up");
  await picker.getByRole("button", { name: /^Push-Up/ }).click();
  await picker.getByRole("button", { name: "Add (1)" }).click();
  await expect(page.getByRole("heading", { name: "Push-Up" })).toBeVisible();

  // Finish early from the menu: only the completed set is saved.
  await page.getByRole("button", { name: "Complete set" }).first().click();
  await page.getByRole("button", { name: "Exercise options" }).click();
  await page.getByRole("menuitem", { name: "Finish Workout" }).click();
  await page
    .getByRole("dialog", { name: "Finish workout?" })
    .getByRole("button", { name: "Finish" })
    .click();

  // Offered to save what was done as a routine.
  const dialog = page.getByRole("dialog", { name: "Save as a routine?" });
  await dialog
    .getByRole("textbox", { name: "Routine name" })
    .fill("Quick push-ups");
  await dialog.getByRole("button", { name: "Save routine" }).click();
  await expect(page).toHaveURL(/\/workouts\/summary\/\d+\?first=true$/);

  const workoutId = Number(new URL(page.url()).pathname.split("/").at(-1));
  const saved = await backend.get<SavedWorkout>(`/workouts/${workoutId}`);
  expect(saved.routineId).toBeNull();
  expect(saved.sets).toHaveLength(1);
  // Previously the start time was missing and the backend capped this at 3 hours.
  expect(saved.duration).toBeLessThan(600);
  const routines = await backend.get<{ name: string }[]>("/routines");
  expect(routines.map((r) => r.name)).toEqual(["Quick push-ups"]);
});
