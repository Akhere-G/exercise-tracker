"use client";
import { demoLoginAction } from "@/src/features/auth/actions";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function DemoPage() {
  const router = useRouter();
  const [error, setError] = useState<null | string>(null);
  // Effects run twice in development; only start one demo session.
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    async function start() {
      try {
        const res = await demoLoginAction();
        if (!res.success) {
          setError(res.error ?? "Could not start demo");
          return;
        }
        router.replace("/routines");
      } catch {
        setError("Could not start demo");
      }
    }
    start();
  }, [router]);

  if (error) {
    return (
      <div className="container text-center justify-center items-center w-full flex flex-col gap-4">
        <h2 className="title">{error}</h2>
        <Link href="/">Return home?</Link>
      </div>
    );
  }

  return (
    <div className="container text-center justify-center items-center w-full flex flex-col gap-4">
      <h2 className="title">Loading demo...</h2>
      <Loader2 className="animate-spin" />
    </div>
  );
}
