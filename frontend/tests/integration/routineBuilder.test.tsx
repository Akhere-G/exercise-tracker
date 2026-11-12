import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RoutineBuilder from "@/src/features/ai/components/RoutineBuilder";
import { buildRoutine, savePreview } from "@/src/features/ai/actions";
import { router } from "@/tests/navigation";
import { toast } from "sonner";
import { renderWithProviders } from "@/tests/render";
import { RoutinePreview } from "@/src/features/ai/types";

vi.mock("next/navigation", () => import("@/tests/navigation"));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/src/features/ai/actions", () => ({
  buildRoutine: vi.fn(),
  savePreview: vi.fn(),
}));

const preview: RoutinePreview = {
  rationale: "Three full-body days suit your schedule.",
  routines: [
    {
      name: "Full body A",
      day: 0,
      items: [
        {
          exerciseId: 1,
          name: "bench press",
          sets: 3,
          reps: 8,
          restSecs: 120,
          supersetGroup: null,
        },
      ],
    },
  ],
};

describe("AI routine builder", () => {
  it("asks for equipment before calling the coach", async () => {
    const { user } = renderWithProviders(<RoutineBuilder />);
    await user.click(screen.getByRole("button", { name: "Build my plan" }));
    expect(toast.error).toHaveBeenCalledWith(
      "Choose at least one kind of equipment",
    );
    expect(buildRoutine).not.toHaveBeenCalled();
  });

  it("previews a plan and saves it", async () => {
    vi.mocked(buildRoutine).mockResolvedValue({ success: true, data: preview });
    vi.mocked(savePreview).mockResolvedValue({ success: true, data: [] });
    const { user } = renderWithProviders(<RoutineBuilder />);

    await user.selectOptions(screen.getByLabelText("Goal"), "strength");
    await user.click(screen.getByRole("button", { name: "Dumbbells" }));
    expect(screen.getByRole("button", { name: "Dumbbells" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.clear(screen.getByLabelText("Days per week"));
    await user.type(screen.getByLabelText("Days per week"), "4");
    await user.click(screen.getByRole("button", { name: "Build my plan" }));

    expect(buildRoutine).toHaveBeenCalledWith(
      expect.objectContaining({
        goal: "strength",
        equipment: ["dumbbells"],
        minutes: 45,
        daysPerWeek: 4,
      }),
    );
    expect(
      await screen.findByText("Three full-body days suit your schedule."),
    ).toBeInTheDocument();
    expect(screen.getByText("Full body A")).toBeInTheDocument();
    expect(screen.getByText("3 × 8")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save routines" }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/routines"));
    expect(savePreview).toHaveBeenCalledWith(preview);
  });

  it("points to prebuilt programs when the coach is unavailable", async () => {
    vi.mocked(buildRoutine).mockResolvedValue({
      success: false,
      status: 503,
      error:
        "The coach is unavailable right now. Try again, or pick a prebuilt program.",
    });
    const { user } = renderWithProviders(<RoutineBuilder />);
    await user.click(screen.getByRole("button", { name: "Barbell" }));
    await user.click(screen.getByRole("button", { name: "Build my plan" }));

    expect(
      await screen.findByText(/The coach is unavailable right now/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Browse prebuilt programs" }),
    ).toHaveAttribute("href", "/programs");
    expect(toast.error).not.toHaveBeenCalled();
  });
});
