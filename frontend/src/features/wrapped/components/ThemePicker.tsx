"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { updateProfile } from "@/src/features/profile/actions";
import { THEME_ORDER, THEMES } from "../themes";
import { WrappedTheme } from "../types";

export default function ThemePicker({ theme }: { theme: WrappedTheme }) {
  const [isSaving, setIsSaving] = useState(false);

  const choose = async (next: WrappedTheme) => {
    setIsSaving(true);
    const response = await updateProfile({ wrappedTheme: next });
    setIsSaving(false);
    if (!response.success) toast.error("Could not save your theme.");
  };

  return (
    <div className="flex flex-wrap gap-2">
      {THEME_ORDER.map((slug) => (
        <Button
          key={slug}
          size="sm"
          disabled={isSaving}
          variant={slug === theme ? "default" : "secondary"}
          onClick={() => choose(slug)}
        >
          {THEMES[slug].emoji} {THEMES[slug].name}
        </Button>
      ))}
    </div>
  );
}
