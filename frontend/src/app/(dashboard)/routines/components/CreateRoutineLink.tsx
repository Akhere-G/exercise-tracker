"use client";
import { track } from "@/src/features/analytics/utils";
import Link from "next/link";

export default function CreateRoutineLink() {
  return (
    <Link
      className="text-center"
      href="/routines/create"
      onClick={() => track("click_create_routine")}
    >
      Add New Routine
    </Link>
  );
}
