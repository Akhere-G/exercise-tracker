"use client";

import { Button } from "@/src/components/ui/button";
import { demoLoginAction } from "@/src/features/auth/actions";
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
        router.push("/routines");
      } else {
        setErrorMessage("The demo is temporarily unavailable.");
      }
    } catch {
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
        size="lg"
        className="w-full"
        disabled={isLoading}
        onClick={onClick}
      >
        {isLoading ? "Starting demo..." : "Try demo"}
      </Button>
      {errorMessage && <p className="text-error mt-2">{errorMessage}</p>}
    </div>
  );
}
