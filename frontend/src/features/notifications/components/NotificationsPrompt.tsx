"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/card";
import { Button } from "@/src/components/ui/button";
import { useEffect, useState } from "react";
import { subscribe } from "../actions";
import {
  checkSubscriptionStatus,
  ensureServiceWorker,
  registerAndSubscribe,
} from "../utils";
import { toast } from "sonner";
import { track } from "@/src/features/analytics/utils";

/** How long "Maybe later" hides the prompt, so it does not nag on every visit. */
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
export const NOTIFICATIONS_DISMISSED_KEY = "notifications-prompt-dismissed-at";

const recentlyDismissed = () => {
  try {
    const dismissedAt = Number(
      localStorage.getItem(NOTIFICATIONS_DISMISSED_KEY),
    );
    return dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
};

const rememberDismissal = () => {
  try {
    localStorage.setItem(NOTIFICATIONS_DISMISSED_KEY, String(Date.now()));
  } catch {}
};

export default function NotificationsPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const initialiseNotifications = async () => {
      if (recentlyDismissed()) return;
      try {
        await ensureServiceWorker();
        const isSubscribed = await checkSubscriptionStatus();
        setShowPrompt(!isSubscribed);
      } catch (error) {
        console.error("Failed to initialise notification checks:", error);
      }
    };

    initialiseNotifications();
  }, []);

  if (!showPrompt) {
    return null;
  }

  const handleSubscribe = async () => {
    try {
      const subscriptionData = await registerAndSubscribe();
      const response = await subscribe(subscriptionData);
      if (!response.success) {
        toast.error(response.error ?? "Could not subscribe.");
        return;
      }
      track("enable_notifications");
      toast.success("Successfully subscribed to notifications.");
      setShowPrompt(false);
    } catch {
      toast.error("Could not subscribe.");
    }
  };

  return (
    <Card className="fixed top-4 right-4 z-50">
      <CardHeader>
        <CardTitle className="w-max">Want notifications?</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-4">
        <Button onClick={handleSubscribe}>Subscribe</Button>
        <Button
          variant="ghost"
          onClick={() => {
            track("dismiss_notifications_prompt");
            rememberDismissal();
            setShowPrompt(false);
          }}
        >
          Maybe later
        </Button>
      </CardContent>
    </Card>
  );
}
