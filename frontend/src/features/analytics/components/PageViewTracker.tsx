"use client";

import "@/src/features/analytics/init";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { getPageEvent, track } from "@/src/features/analytics/utils";

export function PageViewTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    const { event, route } = getPageEvent(pathname);
    track(event, { route });
  }, [pathname]);

  return null;
}
