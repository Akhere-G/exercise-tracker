"use client";
import { track } from "@/src/features/analytics/utils";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";

export default function DataPortabilityButtons() {
  const handleImport = () => {
    track("click_import_data");
    toast.info("Coming soon");
  };

  return (
    <div className="flex flex-wrap gap-3 select-none border-t border-border pt-4">
      <a
        href="/api/export/workouts"
        download
        className="flex items-center gap-2 bg-muted border border-border text-sm font-medium px-4 py-2 rounded-xl hover:bg-accent"
        onClick={() => track("click_export_data")}
      >
        <Download className="h-4 w-4" />
        Export History (.csv)
      </a>
      <a
        href="/api/export/body-weight"
        download
        className="flex items-center gap-2 bg-muted border border-border text-sm font-medium px-4 py-2 rounded-xl hover:bg-accent"
        onClick={() => track("click_export_data")}
      >
        <Download className="h-4 w-4" />
        Export Body Weight (.csv)
      </a>
      <button
        type="button"
        aria-disabled="true"
        className="flex items-center gap-2 bg-muted border border-border text-sm font-medium px-4 py-2 rounded-xl opacity-40"
        onClick={handleImport}
      >
        <Upload className="h-4 w-4" />
        Import Data (.json)
      </button>
    </div>
  );
}
