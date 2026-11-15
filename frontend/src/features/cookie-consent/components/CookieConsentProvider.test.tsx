import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const posthog = vi.hoisted(() => ({
  __loaded: true,
  init: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
}));
vi.mock("posthog-js", () => ({ default: posthog }));

import { CookieConsentProvider } from "./CookieConsentProvider";
import {
  COOKIE_PREFERENCES_STORAGE_KEY,
  openCookieSettings,
} from "../storage";

describe("CookieConsentProvider", () => {
  beforeEach(() => {
    posthog.__loaded = true;
  });

  it("shows the banner until the user accepts analytics cookies", async () => {
    const user = userEvent.setup();
    render(
      <CookieConsentProvider>
        <main>App</main>
      </CookieConsentProvider>,
    );

    expect(
      await screen.findByRole("complementary", { name: "Cookie consent" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Accept cookies" }));

    expect(
      screen.queryByRole("complementary", { name: "Cookie consent" }),
    ).not.toBeInTheDocument();
    expect(posthog.opt_in_capturing).toHaveBeenCalledWith({
      captureEventName: false,
    });
    expect(
      JSON.parse(localStorage.getItem(COOKIE_PREFERENCES_STORAGE_KEY) ?? "{}"),
    ).toMatchObject({ analytics: true, version: 1 });
  });

  it("saves rejected optional cookies and keeps necessary storage enabled", async () => {
    const user = userEvent.setup();
    render(
      <CookieConsentProvider>
        <main>App</main>
      </CookieConsentProvider>,
    );

    await user.click(
      await screen.findByRole("button", { name: "Choose options" }),
    );
    expect(
      screen.getByRole("switch", { name: "Strictly necessary cookies" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("switch", { name: "Analytics cookies" }),
    ).not.toBeChecked();
    await user.click(
      screen.getByRole("button", { name: "Reject optional cookies" }),
    );

    expect(posthog.opt_out_capturing).toHaveBeenCalled();
    expect(
      JSON.parse(localStorage.getItem(COOKIE_PREFERENCES_STORAGE_KEY) ?? "{}"),
    ).toMatchObject({ analytics: false, version: 1 });
  });

  it("reopens saved choices so consent can be withdrawn", async () => {
    localStorage.setItem(
      COOKIE_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        analytics: true,
        updatedAt: "2026-11-15T00:00:00.000Z",
        version: 1,
      }),
    );
    const user = userEvent.setup();
    render(
      <CookieConsentProvider>
        <main>App</main>
      </CookieConsentProvider>,
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("complementary", { name: "Cookie consent" }),
      ).not.toBeInTheDocument();
    });
    openCookieSettings();
    const analyticsSwitch = await screen.findByRole("switch", {
      name: "Analytics cookies",
    });
    expect(analyticsSwitch).toBeChecked();
    await user.click(analyticsSwitch);
    await user.click(screen.getByRole("button", { name: "Save choices" }));

    expect(posthog.opt_out_capturing).toHaveBeenCalled();
    expect(
      JSON.parse(localStorage.getItem(COOKIE_PREFERENCES_STORAGE_KEY) ?? "{}"),
    ).toMatchObject({ analytics: false, version: 1 });
  });
});
