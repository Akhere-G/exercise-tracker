import type { CookiePreferences } from "./types";

export const COOKIE_PREFERENCES_STORAGE_KEY = "gains_cookie_preferences";
export const OPEN_COOKIE_SETTINGS_EVENT = "gains:open-cookie-settings";
const COOKIE_PREFERENCES_CHANGED_EVENT = "gains:cookie-preferences-changed";

let cachedStoredValue: string | null | undefined;
let cachedPreferences: CookiePreferences | null = null;

function isCookiePreferences(value: unknown): value is CookiePreferences {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Partial<CookiePreferences>;
  return (
    candidate.version === 1 &&
    typeof candidate.analytics === "boolean" &&
    typeof candidate.updatedAt === "string"
  );
}

export function readCookiePreferences(): CookiePreferences | null {
  if (typeof window === "undefined") return null;

  try {
    const storedValue = window.localStorage.getItem(
      COOKIE_PREFERENCES_STORAGE_KEY,
    );
    if (storedValue === cachedStoredValue) return cachedPreferences;
    cachedStoredValue = storedValue;
    if (!storedValue) {
      cachedPreferences = null;
      return null;
    }

    const preferences: unknown = JSON.parse(storedValue);
    cachedPreferences = isCookiePreferences(preferences) ? preferences : null;
    return cachedPreferences;
  } catch {
    cachedPreferences = null;
    return null;
  }
}

export function saveCookiePreferences(analytics: boolean): CookiePreferences {
  const preferences: CookiePreferences = {
    analytics,
    updatedAt: new Date().toISOString(),
    version: 1,
  };
  window.localStorage.setItem(
    COOKIE_PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences),
  );
  window.dispatchEvent(new Event(COOKIE_PREFERENCES_CHANGED_EVENT));
  return preferences;
}

export function subscribeToCookiePreferences(
  onStoreChange: () => void,
): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === COOKIE_PREFERENCES_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(COOKIE_PREFERENCES_CHANGED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(COOKIE_PREFERENCES_CHANGED_EVENT, onStoreChange);
  };
}

export function openCookieSettings(): void {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}
