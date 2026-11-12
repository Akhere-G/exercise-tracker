import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RoutineForm from "@/src/app/(dashboard)/routines/components/RoutineForm";
import { getAllExercises } from "@/src/features/exercises/actions";
import { RankedExercise } from "@/src/features/exercises/types";
import { router } from "@/tests/navigation";
import { toast } from "sonner";
import {
  benchPress,
  makeRoutine,
  makeRoutineItem,
  plank,
  pushUp,
  squat,
} from "@/tests/factories";
import { renderWithProviders } from "@/tests/render";
import { Exercise } from "@/src/features/exercises/types";

vi.mock("next/navigation", () => import("@/tests/navigation"));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/src/features/exercises/actions", () => ({
  getAllExercises: vi.fn(),
}));

const ranked = (exercise: Exercise): RankedExercise => ({
  ...exercise,
  setCount: 0,
  workoutCount: 0,
  lastUser: null,
});
const library = [benchPress, squat, pushUp, plank].map(ranked);

beforeEach(() => {
  vi.mocked(getAllExercises).mockImplementation(async ({ page, search }) =>
    page === 1
      ? library.filter((e) =>
          e.name.toLowerCase().includes((search ?? "").toLowerCase()),
        )
      : [],
  );
});

const submitAction = vi.fn();

function renderForm(
  initalData?: Parameters<typeof RoutineForm>[0]["initalData"],
) {
  return renderWithProviders(
    <RoutineForm
      submitAction={submitAction}
      sumbitText="Create"
      initalData={initalData}
    />,
  );
}

async function addExercises(
  user: ReturnType<typeof renderForm>["user"],
  names: string[],
) {
  await user.click(screen.getByRole("button", { name: "Add Exercise" }));
  const picker = await screen.findByRole("dialog");
  for (const name of names) {
    await user.click(
      await within(picker).findByRole("button", { name: new RegExp(name) }),
    );
  }
  await user.click(
    within(picker).getByRole("button", { name: `Add (${names.length})` }),
  );
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
}

const card = (name: string) => screen.getByRole("group", { name });

describe("routine form", () => {
  it("creates a routine with targets, converting the local schedule to UTC", async () => {
    submitAction.mockResolvedValue({ success: true, data: { id: 3 } });
    const { user } = renderForm();

    await user.type(screen.getByLabelText("Name"), "Push day");
    await user.clear(screen.getByLabelText("Start Time"));
    await user.type(screen.getByLabelText("Start Time"), "18:30");
    await user.click(screen.getByRole("button", { name: "Wed" }));
    expect(screen.getByRole("button", { name: "Wed" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await addExercises(user, ["Bench Press", "Plank"]);

    const bench = card("Bench Press");
    await user.clear(within(bench).getByLabelText("Sets"));
    await user.type(within(bench).getByLabelText("Sets"), "4");
    await user.type(within(bench).getByLabelText("Reps"), "8");
    await user.type(within(bench).getByLabelText("Rest (s)"), "120");
    // Timed exercises take a duration instead of reps.
    expect(
      within(card("Plank")).queryByLabelText("Reps"),
    ).not.toBeInTheDocument();
    await user.click(
      within(card("Plank")).getByRole("textbox", { name: "Mins" }),
    );
    await user.keyboard("45{Enter}");

    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(submitAction).toHaveBeenCalledTimes(1));
    const routine = submitAction.mock.calls[0][0];
    // Wednesday 18:30 in UTC+05:30 is Wednesday 13:00 UTC.
    expect(routine).toMatchObject({
      name: "Push day",
      day: 2,
      startTime: "13:00:00Z",
    });
    expect(routine.routineItems).toEqual([
      expect.objectContaining({
        exerciseId: benchPress.id,
        targetSets: 4,
        targetReps: 8,
        restSecs: 120,
        order: 0,
      }),
      expect.objectContaining({
        exerciseId: plank.id,
        targetSets: 3,
        targetDuration: 45,
        order: 1,
      }),
    ]);
    expect(router.push).toHaveBeenCalledWith("/routines");
  });

  it("explains what is missing instead of submitting", async () => {
    const { user } = renderForm();

    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(
      await screen.findByText(
        "You must add at least one exercise to your routine",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("name is a required field")).toBeInTheDocument();
    expect(submitAction).not.toHaveBeenCalled();
  });

  it("requires reps for rep-based exercises", async () => {
    const { user } = renderForm();
    await user.type(screen.getByLabelText("Name"), "Legs");
    await addExercises(user, ["Squat"]);

    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() =>
      expect(within(card("Squat")).getByLabelText("Reps")).toHaveClass(
        "border-error!",
      ),
    );
    expect(submitAction).not.toHaveBeenCalled();
  });

  it("adds picked exercises in the order they were tapped", async () => {
    const { user } = renderForm();
    await addExercises(user, ["Squat", "Plank", "Bench Press"]);
    const exerciseCards = screen
      .getAllByRole("group")
      .filter((g) => g.hasAttribute("aria-label"));
    expect(exerciseCards.map((g) => g.getAttribute("aria-label"))).toEqual([
      "Squat",
      "Plank",
      "Bench Press",
    ]);
  });

  it("links and unlinks a superset", async () => {
    submitAction.mockResolvedValue({ success: true, data: { id: 3 } });
    const { user } = renderForm();
    await user.type(screen.getByLabelText("Name"), "Full body");
    await addExercises(user, ["Bench Press", "Squat", "Push Up"]);
    for (const name of ["Bench Press", "Squat", "Push Up"]) {
      await user.type(within(card(name)).getByLabelText("Reps"), "10");
    }

    await user.click(
      within(card("Bench Press")).getByRole("button", {
        name: "Superset with next",
      }),
    );
    expect(
      within(card("Bench Press")).getByText("Superset 1"),
    ).toBeInTheDocument();
    expect(within(card("Squat")).getByText("Superset 1")).toBeInTheDocument();
    await user.click(
      within(card("Bench Press")).getByRole("button", {
        name: "Unlink from next",
      }),
    );
    expect(
      within(card("Bench Press")).queryByText("Superset 1"),
    ).not.toBeInTheDocument();
    await user.click(
      within(card("Bench Press")).getByRole("button", {
        name: "Superset with next",
      }),
    );

    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(submitAction).toHaveBeenCalled());
    expect(
      submitAction.mock.calls[0][0].routineItems.map(
        (i: { supersetGroup?: number | null }) => i.supersetGroup ?? null,
      ),
    ).toEqual([1, 1, null]);
  });

  it("renumbers exercise order after a removal", async () => {
    submitAction.mockResolvedValue({ success: true, data: { id: 3 } });
    const { user } = renderForm();
    await user.type(screen.getByLabelText("Name"), "Full body");
    await addExercises(user, ["Bench Press", "Squat"]);
    await user.click(
      screen.getByRole("button", { name: "Remove Bench Press" }),
    );
    await addExercises(user, ["Push Up"]);
    for (const name of ["Squat", "Push Up"]) {
      await user.type(within(card(name)).getByLabelText("Reps"), "10");
    }

    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(submitAction).toHaveBeenCalled());
    expect(
      submitAction.mock.calls[0][0].routineItems.map(
        (i: { exerciseId: number; order: number }) => [i.exerciseId, i.order],
      ),
    ).toEqual([
      [squat.id, 0],
      [pushUp.id, 1],
    ]);
  });

  it("shows the API error and stays on the page when saving fails", async () => {
    submitAction.mockResolvedValue({
      success: false,
      error: "Duplicate exercise in routine",
    });
    const { user } = renderForm();
    await user.type(screen.getByLabelText("Name"), "Push day");
    await addExercises(user, ["Push Up"]);
    await user.type(within(card("Push Up")).getByLabelText("Reps"), "15");

    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Duplicate exercise in routine"),
    );
    expect(router.push).not.toHaveBeenCalled();
  });

  it("ignores a second click while the first save is in flight", async () => {
    let finish: (value: unknown) => void = () => {};
    submitAction.mockImplementation(
      () => new Promise((resolve) => (finish = resolve)),
    );
    const { user } = renderForm();
    await user.type(screen.getByLabelText("Name"), "Push day");
    await addExercises(user, ["Push Up"]);
    await user.type(within(card("Push Up")).getByLabelText("Reps"), "15");

    const create = screen.getByRole("button", { name: "Create" });
    await user.click(create);
    await waitFor(() => expect(create).toBeDisabled());
    await user.click(create);

    expect(submitAction).toHaveBeenCalledTimes(1);
    finish({ success: true, data: { id: 1 } });
  });

  it("loads an existing routine in local time for editing", async () => {
    const routine = makeRoutine({
      name: "Pull day",
      day: 6,
      startTime: "23:30:00Z",
      routineItems: [makeRoutineItem(squat, { targetSets: 5, targetReps: 5 })],
    });
    renderForm(routine);

    expect(await screen.findByDisplayValue("Pull day")).toBeInTheDocument();
    // Sunday 23:30 UTC is Monday 05:00 in UTC+05:30.
    expect(screen.getByLabelText("Start Time")).toHaveValue("05:00");
    expect(screen.getByRole("button", { name: "Mon" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(card("Squat")).getByLabelText("Sets")).toHaveValue(5);
  });
});

describe("exercise picker", () => {
  it("searches after typing stops and marks exercises already in the routine", async () => {
    const routine = makeRoutine({
      routineItems: [makeRoutineItem(benchPress, { targetSets: 3 })],
    });
    const { user } = renderForm(routine);
    await screen.findByDisplayValue("Push day");

    await user.click(screen.getByRole("button", { name: "Add Exercise" }));
    const picker = await screen.findByRole("dialog");
    expect(
      await within(picker).findByRole("button", { name: /Bench Press/ }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.type(
      within(picker).getByRole("textbox", { name: "Search exercises" }),
      "squ",
    );

    await waitFor(() =>
      expect(getAllExercises).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "squ", page: 1 }),
      ),
    );
    // Debounced: one search for the final text, not one per keystroke.
    expect(
      vi.mocked(getAllExercises).mock.calls.filter(([p]) => p.search === "s"),
    ).toHaveLength(0);
    expect(
      await within(picker).findByRole("button", { name: /Squat/ }),
    ).toBeInTheDocument();
    expect(
      within(picker).queryByRole("button", { name: /Bench Press/ }),
    ).not.toBeInTheDocument();
  });

  it("shows when a search finds nothing, and when loading fails", async () => {
    const { user } = renderForm();
    await user.click(screen.getByRole("button", { name: "Add Exercise" }));
    const picker = await screen.findByRole("dialog");

    await user.type(
      within(picker).getByRole("textbox", { name: "Search exercises" }),
      "zzz",
    );
    expect(
      await within(picker).findByText("No exercises found."),
    ).toBeInTheDocument();

    vi.mocked(getAllExercises).mockRejectedValue(new Error("offline"));
    await user.type(
      within(picker).getByRole("textbox", { name: "Search exercises" }),
      "z",
    );
    expect(
      await within(picker).findByText("Failed to load exercises."),
    ).toBeInTheDocument();
  });
});
