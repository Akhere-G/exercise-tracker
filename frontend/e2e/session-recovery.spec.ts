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
