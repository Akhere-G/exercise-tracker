import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { benchPress, makeRoutine, pushUp, squat } from "@/tests/factories";
import type { RoutineSchema } from "@/src/features/routines/schema";

const push = vi.hoisted(() => vi.fn());
const toast = vi.hoisted(() => Object.assign(vi.fn(), { error: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("sonner", () => ({ toast }));
// The real picker is a remote-data drawer; this stand-in only exposes its contract
// (open flag in, selected exercises out).
vi.mock("@/src/app/(dashboard)/routines/components/ExercisePickerModal", async () => {
  const { benchPress, pushUp, squat } = await import("@/tests/factories");
  return {
    ExercisePickerModal: ({
      isOpen,
      onSelect,
    }: {
      isOpen: boolean;
      onSelect: (exercises: unknown[]) => void;
    }) =>
      isOpen ? (
        <div role="dialog" aria-label="Pick exercises">
          {[benchPress, pushUp, squat].map((exercise) => (
            <button key={exercise.id} onClick={() => onSelect([exercise])}>
              Pick {exercise.name}
            </button>
          ))}
        </div>
      ) : null,
  };
});

import RoutineForm from "@/src/app/(dashboard)/routines/components/RoutineForm";

type Submit = (data: RoutineSchema) => Promise<
  { success: true; data: ReturnType<typeof makeRoutine> } | { success: false; error: string }
>;

const ok: Submit = async () => ({ success: true, data: makeRoutine() });

async function addExercise(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole("button", { name: "Add Exercise" }));
  await user.click(screen.getByRole("button", { name: `Pick ${name}` }));
}

/** Fills the reps field of the nth exercise card (each card has sets then reps inputs). */
async function setReps(user: ReturnType<typeof userEvent.setup>, index: number, reps: string) {
  const inputs = screen.getAllByRole("spinbutton");
  await user.clear(inputs[index * 2 + 1]);
  await user.type(inputs[index * 2 + 1], reps);
}

function submitted(mock: ReturnType<typeof vi.fn>): RoutineSchema {
  return mock.mock.calls[0][0];
}

beforeEach(() => {
  push.mockClear();
  toast.error.mockClear();
});

describe("creating a routine", () => {
  it("blocks submission and explains what is missing", async () => {
    const user = userEvent.setup({ delay: null });
    const submit = vi.fn(ok);
    render(<RoutineForm submitAction={submit} sumbitText="Create" />);

    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(
      await screen.findByText("You must add at least one exercise to your routine"),
    ).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it("requires reps for rep-based exercises", async () => {
    const user = userEvent.setup({ delay: null });
    const submit = vi.fn(ok);
    render(<RoutineForm submitAction={submit} sumbitText="Create" />);
    await user.type(screen.getByLabelText("Name"), "Push day");
    await addExercise(user, "Bench Press");

    await user.click(screen.getByRole("button", { name: "Create" }));

    const [, repsInput] = screen.getAllByRole("spinbutton");
    await waitFor(() => expect(repsInput.className).toContain("border-error"));
    expect(submit).not.toHaveBeenCalled();
  });

  it("submits the routine with items in the order they were added, then leaves the page", async () => {
    const user = userEvent.setup({ delay: null });
    const submit = vi.fn(ok);
    render(<RoutineForm submitAction={submit} sumbitText="Create" />);

    await user.type(screen.getByLabelText("Name"), "Push day");
    await addExercise(user, "Bench Press");
    await addExercise(user, "Push Up");
    await setReps(user, 0, "8");
    await setReps(user, 1, "15");
    await user.click(screen.getByRole("button", { name: "Thurs" }));
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    const data = submitted(submit);
    expect(data).toMatchObject({ name: "Push day", day: 3, startTime: "12:00" });
    expect(data.routineItems.map((i) => [i.exerciseId, i.order, Number(i.targetReps)])).toEqual([
      [benchPress.id, 0, 8],
      [pushUp.id, 1, 15],
    ]);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/routines"));
  });

  it("does not add the same exercise twice", async () => {
    const user = userEvent.setup({ delay: null });
    render(<RoutineForm submitAction={ok} sumbitText="Create" />);

    await addExercise(user, "Bench Press");
    await addExercise(user, "Bench Press");

    expect(screen.getAllByText("Bench Press")).toHaveLength(1);
  });

  it("renumbers order contiguously after an exercise is removed", async () => {
    const user = userEvent.setup({ delay: null });
    const submit = vi.fn(ok);
    render(<RoutineForm submitAction={submit} sumbitText="Create" />);
    await user.type(screen.getByLabelText("Name"), "Legs");
    await addExercise(user, "Bench Press");
    await addExercise(user, "Push Up");

    const firstCard = screen.getByText("Bench Press").closest("div.card-custom") as HTMLElement;
    await user.click(within(firstCard).getAllByRole("button")[0]); // remove Bench Press
    await addExercise(user, "Squat");
    await setReps(user, 0, "12");
    await setReps(user, 1, "5");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submitted(submit).routineItems.map((i) => [i.exerciseId, i.order])).toEqual([
      [pushUp.id, 0],
      [squat.id, 1],
    ]);
  });

  it("stays on the form and shows the error when the server rejects the routine", async () => {
    const user = userEvent.setup({ delay: null });
    const submit = vi.fn<Submit>(async () => ({ success: false, error: "Name already used" }));
    render(<RoutineForm submitAction={submit} sumbitText="Create" />);
    await user.type(screen.getByLabelText("Name"), "Push day");
    await addExercise(user, "Bench Press");
    await setReps(user, 0, "8");

    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Name already used"));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Name")).toHaveValue("Push day");
    expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
  });

  it("submits only once while the request is in flight", async () => {
    const user = userEvent.setup({ delay: null });
    let finish!: () => void;
    const submit = vi.fn<Submit>(
      () =>
        new Promise((resolve) => {
          finish = () => resolve({ success: true, data: makeRoutine() });
        }),
    );
    render(<RoutineForm submitAction={submit} sumbitText="Create" />);
    await user.type(screen.getByLabelText("Name"), "Push day");
    await addExercise(user, "Bench Press");
    await setReps(user, 0, "8");
    const button = screen.getByRole("button", { name: "Create" });

    await user.click(button);
    await user.click(button);
    finish();

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(submit).toHaveBeenCalledTimes(1);
  });
});

describe("editing a routine", () => {
  it("loads the existing routine and submits changes", async () => {
    const user = userEvent.setup({ delay: null });
    const submit = vi.fn(ok);
    render(
      <RoutineForm
        submitAction={submit}
        sumbitText="Save"
        initalData={makeRoutine({ name: "Old name", day: 4 })}
      />,
    );

    await waitFor(() => expect(screen.getByLabelText("Name")).toHaveValue("Old name"));
    expect(screen.getByLabelText("Start Time")).toHaveValue("18:30");
    expect(screen.getByText("Bench Press")).toBeInTheDocument();
    expect(screen.getByText("Push Up")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "New name");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    const data = submitted(submit);
    expect(data).toMatchObject({ name: "New name", day: 4, startTime: "18:30" });
    expect(data.routineItems.map((i) => i.exerciseId)).toEqual([benchPress.id, pushUp.id]);
  });
});
