"use client";

import { Input } from "@/src/components/ui/input";
import { useState } from "react";

interface TimeInputProps {
  value: number | string;
  onChange?: (seconds: number) => void;
  canBeZero?: boolean;
  className?: string;
  "aria-label"?: string;
}

const formatTime = (value: number | string): string => {
  if (value === "" || value === null || value === undefined) return "";
  const total = Math.round(Number(value));
  if (!Number.isFinite(total) || total < 0) return "";

  const mins = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const secs = (total % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

const parseDigits = (digits: string): number | null => {
  if (digits === "") return null;
  const mins = Number(digits.slice(0, -2) || 0);
  const secs = Number(digits.slice(-2));
  return mins * 60 + secs;
};

export default function TimeInput({
  value,
  onChange,
  canBeZero = false,
  className,
  "aria-label": ariaLabel,
}: TimeInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = () => {
    const total = parseDigits(draft);
    if (total !== null && (total > 0 || canBeZero)) {
      onChange?.(total);
    }
    setDraft("");
    setIsEditing(false);
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      aria-label={ariaLabel}
      className={`w-full  text-center font-medium h-8 border-input border placeholder-muted-foreground ${className ?? ""}`}
      placeholder={formatTime(value) || "00:00"}
      value={isEditing ? draft : formatTime(value)}
      onFocus={(e) => {
        setDraft("");
        setIsEditing(true);
        e.currentTarget.select();
      }}
      onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 6))}
      onKeyDownCapture={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          setDraft("");
          e.currentTarget.blur();
        }
      }}
      onBlur={commit}
    />
  );
}
