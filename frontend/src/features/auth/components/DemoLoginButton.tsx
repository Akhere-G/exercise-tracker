"use client";

import { Button } from "@/src/components/ui/button";
import { demoLoginAction } from "@/src/features/auth/actions";
import { getFailureReason, track } from "@/src/features/analytics/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DemoLoginButton({
  variant = "default",
  className,
}: {
  variant?: "default" | "secondary" | "outline";
  className?: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onClick = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await demoLoginAction();
      if (response.success) {
        track("login", { method: "demo" });
        router.push("/routines");
      } else {
        track("login_failed", {
          method: "demo",
          reason: getFailureReason(response),
        });
        setErrorMessage("The demo is temporarily unavailable.");
      }
    } catch {
      track("login_failed", { method: "demo", reason: "exception" });
      setErrorMessage("Sorry... Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <Button
        type="button"
        variant={variant}
        className="text-xl w-full h-12.5 rounded-xl px-6"
        disabled={isLoading}
        onClick={onClick}
      >
        {isLoading ? "Starting demo..." : "Try demo"}
      </Button>
      {errorMessage && <p className="text-error mt-2">{errorMessage}</p>}
    </div>
  );
}
