"use client";
import { track } from "@/src/features/analytics/utils";
import Link from "next/link";

export default function CreateRoutineLink() {
  return (
    <div className="flex flex-col gap-2 text-center">
      <Link
        href="/routines/create"
        onClick={() => track("click_create_routine")}
      >
        Add New Routine
      </Link>
      <Link href="/programs">Browse programs</Link>
    </div>
  );
}
