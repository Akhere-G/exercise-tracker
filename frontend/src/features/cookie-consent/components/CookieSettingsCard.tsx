"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { openCookieSettings } from "../storage";

export function CookieSettingsCard() {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 md:col-span-2 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Privacy and cookies</h3>
          <p className="text-sm text-muted-foreground">
            Review or withdraw your analytics cookie consent at any time.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={openCookieSettings}>
          Cookie settings
        </Button>
        <Link href="/privacy" className="text-sm">
          Privacy Policy
        </Link>
        <Link href="/terms" className="text-sm">
          Terms
        </Link>
      </div>
    </div>
  );
}
