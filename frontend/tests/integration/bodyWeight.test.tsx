import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BodyWeightForm from "@/src/features/body/components/BodyWeightForm";
import BodyWeightList from "@/src/features/body/components/BodyWeightList";
import { deleteBodyWeight, saveBodyWeight } from "@/src/features/body/actions";
import { toast } from "sonner";
import { renderWithProviders } from "@/tests/render";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/src/features/body/actions", () => ({
  saveBodyWeight: vi.fn(),
  deleteBodyWeight: vi.fn(),
}));

describe("logging body weight", () => {
  it("saves today's weight converted from the user's unit", async () => {
    vi.mocked(saveBodyWeight).mockResolvedValue({
      success: true,
      data: { id: 1, measuredOn: "", weightKg: 0 },
    });
    const { user } = renderWithProviders(<BodyWeightForm />, {
      profile: { weightUnit: "lb" },
    });

    expect(screen.getByLabelText("Date")).toHaveValue(
      new Date().toLocaleDateString("en-CA"),
    );
    await user.type(screen.getByLabelText("Weight (lb)"), "176.4");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Weight saved"),
    );
    expect(saveBodyWeight).toHaveBeenCalledWith(
      new Date().toLocaleDateString("en-CA"),
      80.014,
    );
    expect(screen.getByLabelText("Weight (lb)")).toHaveValue(null);
  });

  it("rejects an empty or impossible weight before calling the server", async () => {
    const { user } = renderWithProviders(<BodyWeightForm />);

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(toast.error).toHaveBeenLastCalledWith("Enter your weight");

    await user.type(screen.getByLabelText("Weight (kg)"), "0");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(toast.error).toHaveBeenLastCalledWith("Weight must be above zero");
    expect(saveBodyWeight).not.toHaveBeenCalled();
  });

  it("keeps the entry when the server rejects it", async () => {
    vi.mocked(saveBodyWeight).mockResolvedValue({
      success: false,
      error: "measured_on cannot be in the future.",
    });
    const { user } = renderWithProviders(<BodyWeightForm />);
    await user.type(screen.getByLabelText("Weight (kg)"), "80");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "measured_on cannot be in the future.",
      ),
    );
    expect(screen.getByLabelText("Weight (kg)")).toHaveValue(80);
  });
});

describe("weigh-in history", () => {
  const weights = [
    { id: 1, measuredOn: "2026-10-30", weightKg: 81 },
    { id: 2, measuredOn: "2026-11-02", weightKg: 80.5 },
  ];

  it("lists newest first in the user's unit and deletes an entry", async () => {
    vi.mocked(deleteBodyWeight).mockResolvedValue({ success: true, data: 2 });
    const { user } = renderWithProviders(<BodyWeightList weights={weights} />, {
      profile: { weightUnit: "lb" },
    });

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Mon, 2 Nov 2026");
    expect(items[0]).toHaveTextContent("177.5 lb");
    expect(items[1]).toHaveTextContent("Fri, 30 Oct 2026");

    await user.click(
      screen.getByRole("button", {
        name: "Delete weigh-in on Mon, 2 Nov 2026",
      }),
    );
    expect(deleteBodyWeight).toHaveBeenCalledWith(2);
  });

  it("has an empty state", () => {
    renderWithProviders(<BodyWeightList weights={[]} />);
    expect(screen.getByText("No weigh-ins yet.")).toBeInTheDocument();
  });
});
