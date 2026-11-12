import { expect, test } from "./support/fixtures";

test("a routine can be edited and deleted", async ({ page, backend }) => {
  const squat = await backend.exercise("Barbell Full Squat");
  await backend.send("post", "/routines", {
    name: "Leg day",
    day: 0,
    startTime: "07:00:00Z",
    routineItems: [
      { exerciseId: squat.id, targetSets: 3, targetReps: 5, order: 0 },
    ],
  });

  await page.goto("/routines");
  await page.getByRole("button", { name: "Leg day options" }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();

  await expect(page.getByLabel("Name")).toHaveValue("Leg day");
  await page.getByLabel("Name").fill("Heavy legs");
  await page.getByRole("button", { name: "Fri" }).click();
  await page
    .getByRole("group", { name: "Barbell Full Squat" })
    .getByLabel("Sets")
    .fill("5");
  await page.getByRole("button", { name: "Edit", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Heavy legs" })).toBeVisible();
  const [routine] =
    await backend.get<
      { name: string; day: number; routineItems: { targetSets: number }[] }[]
    >("/routines");
  expect(routine).toMatchObject({ name: "Heavy legs", day: 4 });
  expect(routine.routineItems[0].targetSets).toBe(5);

  await page.getByRole("button", { name: "Heavy legs options" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page
    .getByRole("dialog", { name: "Delete Heavy legs?" })
    .getByRole("button", { name: "Delete" })
    .click();

  await expect(page.getByRole("heading", { name: "Heavy legs" })).toHaveCount(
    0,
  );
  expect(await backend.get<unknown[]>("/routines")).toEqual([]);
});

test("an incomplete routine is not saved", async ({ page, backend }) => {
  await page.goto("/routines/create");
  await page.getByRole("button", { name: "Create" }).click();

  await expect(
    page.getByText("You must add at least one exercise to your routine"),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/routines\/create$/);
  expect(await backend.get<unknown[]>("/routines")).toEqual([]);
});

test("a prebuilt program adds its routines", async ({ page, backend }) => {
  await page.goto("/programs");
  await page
    .getByRole("button", { name: "Add to my routines" })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  const programName = (await dialog
    .getByRole("heading")
    .first()
    .textContent())!.replace(/^Add /, "");
  await dialog.getByRole("button", { name: "Add to my routines" }).click();

  await expect(page).toHaveURL(/\/routines$/);
  const routines = await backend.get<{ name: string }[]>("/routines");
  expect(routines.length).toBeGreaterThan(0);
  await expect(
    page.getByRole("heading", { name: routines[0].name }),
  ).toBeVisible();
  expect(programName.length).toBeGreaterThan(0);
});

test("the AI builder explains when the coach is unavailable", async ({
  page,
  backend,
}) => {
  await page.goto("/routines/build");
  await page.getByRole("button", { name: "Dumbbells" }).click();
  await page.getByRole("button", { name: "Build my plan" }).click();

  await expect(
    page.getByText(/The coach is unavailable right now/),
  ).toBeVisible();
  await page.getByRole("link", { name: "Browse prebuilt programs" }).click();
  await expect(page).toHaveURL(/\/programs$/);
  expect(await backend.get<unknown[]>("/routines")).toEqual([]);
});
