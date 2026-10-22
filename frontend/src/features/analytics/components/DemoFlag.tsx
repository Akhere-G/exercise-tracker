"use client";

import { useEffect } from "react";
import { markDemoSession } from "@/src/features/analytics/utils";

export function DemoFlag() {
  useEffect(() => {
    markDemoSession();
  }, []);

  return null;
}
