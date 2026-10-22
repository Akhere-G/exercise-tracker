"use client";

import { Button } from "@/src/components/ui/button";
import { logoutAction } from "@/src/features/auth/actions";
import { resetAnalytics, track } from "@/src/features/analytics/utils";
import { LogOut } from "lucide-react";

export function LogoutButton({
  label = "Log out",
  source = "settings",
}: {
  label?: string;
  source?: "settings" | "demo_banner";
}) {
  const onSubmit = () => {
    track("logout", { source });
    resetAnalytics();
  };

  return (
    <form action={logoutAction} onSubmit={onSubmit}>
      <Button type="submit" variant="outline">
        <LogOut />
        {label}
      </Button>
    </form>
  );
}
