import { describe, expect, it, vi } from "vitest";
import {
  COOKIE_PREFERENCES_STORAGE_KEY,
  OPEN_COOKIE_SETTINGS_EVENT,
  openCookieSettings,
  readCookiePreferences,
  saveCookiePreferences,
} from "./storage";

describe("cookie preference storage", () => {
  it("returns null when no valid preference has been saved", () => {
    expect(readCookiePreferences()).toBeNull();

    localStorage.setItem(COOKIE_PREFERENCES_STORAGE_KEY, "not-json");
    expect(readCookiePreferences()).toBeNull();

    localStorage.setItem(
      COOKIE_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ version: 2, analytics: true, updatedAt: "today" }),
    );
    expect(readCookiePreferences()).toBeNull();
  });

  it("saves and restores an analytics choice", () => {
    const preferences = saveCookiePreferences(true);

    expect(preferences).toMatchObject({ version: 1, analytics: true });
    expect(readCookiePreferences()).toEqual(preferences);
  });

  it("announces when cookie settings should open", () => {
    const listener = vi.fn();
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, listener);

    openCookieSettings();

    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, listener);
  });
});
