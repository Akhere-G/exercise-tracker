import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import NotificationsPrompt, {
  NOTIFICATIONS_DISMISSED_KEY,
} from "@/src/features/notifications/components/NotificationsPrompt";
import {
  checkSubscriptionStatus,
  registerAndSubscribe,
} from "@/src/features/notifications/utils";
import { subscribe } from "@/src/features/notifications/actions";
import { toast } from "sonner";
import { renderWithProviders } from "@/tests/render";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/src/features/notifications/utils", () => ({
  ensureServiceWorker: vi.fn(async () => ({})),
  checkSubscriptionStatus: vi.fn(async () => false),
  registerAndSubscribe: vi.fn(),
}));
vi.mock("@/src/features/notifications/actions", () => ({ subscribe: vi.fn() }));

const DAY_MS = 24 * 60 * 60 * 1000;

afterEach(() => vi.useRealTimers());

describe("notifications prompt", () => {
  it("offers notifications to users who are not subscribed", async () => {
    renderWithProviders(<NotificationsPrompt />);
    expect(await screen.findByText("Want notifications?")).toBeInTheDocument();
  });

  it("stays hidden for subscribed users", async () => {
    vi.mocked(checkSubscriptionStatus).mockResolvedValueOnce(true);
    renderWithProviders(<NotificationsPrompt />);
    await waitFor(() => expect(checkSubscriptionStatus).toHaveBeenCalled());
    expect(screen.queryByText("Want notifications?")).not.toBeInTheDocument();
  });

  it("'Maybe later' is remembered for a week instead of nagging on every visit", async () => {
    const { user, unmount } = renderWithProviders(<NotificationsPrompt />);
    await user.click(
      await screen.findByRole("button", { name: "Maybe later" }),
    );
    expect(screen.queryByText("Want notifications?")).not.toBeInTheDocument();
    unmount();

    // Six days later: still quiet.
    vi.useFakeTimers({ shouldAdvanceTime: true, now: Date.now() + 6 * DAY_MS });
    const sixDays = renderWithProviders(<NotificationsPrompt />);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByText("Want notifications?")).not.toBeInTheDocument();
    sixDays.unmount();

    // After the cooldown it may ask again.
    vi.setSystemTime(Date.now() + 2 * DAY_MS);
    renderWithProviders(<NotificationsPrompt />);
    expect(await screen.findByText("Want notifications?")).toBeInTheDocument();
  });

  it("ignores an unreadable dismissal record", async () => {
    localStorage.setItem(NOTIFICATIONS_DISMISSED_KEY, "not-a-time");
    renderWithProviders(<NotificationsPrompt />);
    expect(await screen.findByText("Want notifications?")).toBeInTheDocument();
  });

  it("explains when subscribing fails", async () => {
    vi.mocked(registerAndSubscribe).mockResolvedValue({} as never);
    vi.mocked(subscribe).mockResolvedValue({
      success: false,
      error: "Push is not configured",
    });
    const { user } = renderWithProviders(<NotificationsPrompt />);

    await user.click(await screen.findByRole("button", { name: "Subscribe" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Push is not configured"),
    );
    expect(screen.getByText("Want notifications?")).toBeInTheDocument();
  });
});
