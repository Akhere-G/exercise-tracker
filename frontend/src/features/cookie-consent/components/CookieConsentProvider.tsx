"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { applyPostHogConsent } from "@/src/features/analytics/consent";
import "@/src/features/analytics/init";
import {
  OPEN_COOKIE_SETTINGS_EVENT,
  readCookiePreferences,
  saveCookiePreferences,
  subscribeToCookiePreferences,
} from "../storage";

export function CookieConsentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const preferences = useSyncExternalStore(
    subscribeToCookiePreferences,
    readCookiePreferences,
    () => undefined,
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    const openSettings = () => {
      const currentPreferences = readCookiePreferences();
      setAnalyticsEnabled(currentPreferences?.analytics ?? false);
      setIsSettingsOpen(true);
    };

    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
    return () => {
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
    };
  }, []);

  useEffect(() => {
    if (preferences !== undefined) applyPostHogConsent(preferences);
  }, [preferences]);

  const savePreferences = (analytics: boolean) => {
    saveCookiePreferences(analytics);
    setAnalyticsEnabled(analytics);
    setIsSettingsOpen(false);
  };

  return (
    <>
      {children}

      {preferences === null && (
        <aside
          aria-label="Cookie consent"
          className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-3xl rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xl sm:p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h2 className="text-base font-bold">Your cookie choices</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                We use necessary storage to run Gains. With your permission,
                PostHog analytics cookies help us understand how Gains is used.
                Without permission, PostHog continues in cookieless mode. Read
                our <Link href="/privacy">Privacy Policy</Link>.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setIsSettingsOpen(true)}
              >
                Choose options
              </Button>
              <Button
                type="button"
                size="lg"
                onClick={() => savePreferences(true)}
              >
                Accept cookies
              </Button>
            </div>
          </div>
        </aside>
      )}

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cookie settings</DialogTitle>
            <DialogDescription>
              Choose how Gains may store information on this device. You can
              change these choices at any time in Settings. See our{" "}
              <Link href="/privacy">Privacy Policy</Link> and{" "}
              <Link href="/terms">Terms</Link>.
            </DialogDescription>
          </DialogHeader>

          <div className="divide-y divide-border rounded-xl border border-border">
            <CookieCategory
              title="Strictly necessary"
              description="Required for sign-in, security, core app features, and saving your cookie choice. These cannot be switched off."
              enabled
              disabled
              onChange={() => undefined}
            />
            <CookieCategory
              title="Analytics"
              description="Allows PostHog to use cookies and local storage to measure usage across visits. When off, PostHog only uses privacy-preserving cookieless tracking."
              enabled={analyticsEnabled}
              onChange={setAnalyticsEnabled}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => savePreferences(false)}
            >
              Reject optional cookies
            </Button>
            <Button
              type="button"
              onClick={() => savePreferences(analyticsEnabled)}
            >
              Save choices
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CookieCategory({
  title,
  description,
  enabled,
  disabled = false,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-label={`${title} cookies`}
        aria-checked={enabled}
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-muted transition-colors aria-checked:bg-primary disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span
          className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-foreground transition-transform ${enabled ? "translate-x-5" : ""}`}
        />
      </button>
    </div>
  );
}
