"use client";

import { track } from "@/src/features/analytics/utils";
import Link from "next/link";

export function DemoCreateAccountLink() {
  return (
    <Link
      href="/register"
      className="font-medium text-primary hover:underline"
      onClick={() => track("click_demo_create_account")}
    >
      Create account
    </Link>
  );
}
