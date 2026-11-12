"use client";

import { Input } from "@/src/components/ui/input";
import { useState } from "react";

export default function SetInput({
  value,
  onChange,
  canBeZero,
  canBeNegative,
  "aria-label": ariaLabel,
}: {
  value: number | string;
  onChange?: (val: string) => void;
  canBeZero?: boolean;
  canBeNegative?: boolean;
  "aria-label"?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [dirty, setDirty] = useState("");

  const commit = () => {
    const num = Number(dirty.trim());
    if (num || (dirty.trim() === "0" && canBeZero)) {
      const final = canBeNegative ? dirty : Math.abs(num).toString();
      onChange?.(final);
      setDirty(final);
    }
    setIsEditing(false);
  };

  return (
    <Input
      type="number"
      aria-label={ariaLabel}
      className="w-16 h-10 text-center font-medium bg-transparent! border-none placeholder-muted-foreground"
      placeholder={value.toString()}
      value={isEditing ? dirty : value}
      onFocus={() => setIsEditing(true)}
      onChange={(e) => setDirty(e.target.value)}
      onKeyDownCapture={(e) => e.key === "Enter" && e.currentTarget.blur()}
      onBlur={commit}
    />
  );
}
