"use client";
import { track } from "@/src/features/analytics/utils";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";

export default function DataPortabilityButtons() {
  const handleClick = (event: "click_export_data" | "click_import_data") => {
    track(event);
    toast.info("Coming soon");
  };

  return (
    <div className="flex flex-wrap gap-3 select-none border-t border-border pt-4">
      <button
        type="button"
        aria-disabled="true"
        className="flex items-center gap-2 bg-muted border border-border text-sm font-medium px-4 py-2 rounded-xl opacity-40"
        onClick={() => handleClick("click_export_data")}
      >
        <Download className="h-4 w-4" />
        Export History (.csv)
      </button>
      <button
        type="button"
        aria-disabled="true"
        className="flex items-center gap-2 bg-muted border border-border text-sm font-medium px-4 py-2 rounded-xl opacity-40"
        onClick={() => handleClick("click_import_data")}
      >
        <Upload className="h-4 w-4" />
        Import Data (.json)
      </button>
    </div>
  );
}
