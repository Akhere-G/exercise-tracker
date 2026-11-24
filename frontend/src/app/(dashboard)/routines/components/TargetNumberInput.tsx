"use client";

import { useState } from "react";
import { Input } from "@/src/components/ui/input";

interface TargetNumberInputProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  "aria-label": string;
  step?: number;
  hasError?: boolean;
}

/** Keeps what the user types while editing, so unit conversions never rewrite it. */
export function TargetNumberInput({
  value,
  onChange,
  "aria-label": ariaLabel,
  step,
  hasError,
}: TargetNumberInputProps) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <Input
      type="number"
      inputMode="decimal"
      min={0}
      step={step}
      aria-label={ariaLabel}
      className={`text-center ${hasError ? "border border-error!" : ""}`}
      value={draft ?? value ?? ""}
      onFocus={() => setDraft(value == null ? "" : String(value))}
      onChange={(e) => {
        setDraft(e.target.value);
        onChange(e.target.value === "" ? null : Number(e.target.value));
      }}
      onBlur={() => setDraft(null)}
    />
  );
}
