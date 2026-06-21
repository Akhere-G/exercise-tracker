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

export default function NotificationsPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const initialiseNotifications = async () => {
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
      await subscribe(subscriptionData);
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
        <Button variant="ghost" onClick={() => setShowPrompt(false)}>
          Maybe later
        </Button>
      </CardContent>
    </Card>
  );
}
