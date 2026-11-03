"use client";
import { useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { track } from "@/src/features/analytics/utils";
import { useWeightUnit } from "@/src/features/profile/components/ProfileProvider";
import { shareElementAsImage } from "@/src/features/share/utils";
import { buildSlides } from "../slides";
import { THEMES } from "../themes";
import { Wrapped, WrappedTheme } from "../types";
import WrappedShareCard from "./WrappedShareCard";

interface WrappedStoryProps {
  wrapped: Wrapped;
  theme: WrappedTheme;
  title: string;
}

export default function WrappedStory({
  wrapped,
  theme,
  title,
}: WrappedStoryProps) {
  const unit = useWeightUnit();
  const slides = buildSlides(wrapped, theme, unit);
  const [index, setIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const copy = THEMES[theme];
  const isSummary = index >= slides.length;

  const share = async () => {
    if (!cardRef.current) return;
    try {
      const result = await shareElementAsImage(cardRef.current, {
        filename: "gains-wrapped.png",
        title: `My ${title}`,
      });
      if (result !== "cancelled") {
        track("share_wrapped", { theme, method: result });
      }
    } catch {
      toast.error("Could not create the image.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1" aria-hidden>
        {[...slides, null].map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full bg-muted"
            style={i <= index ? { backgroundColor: copy.accent } : undefined}
          />
        ))}
      </div>

      <button
        type="button"
        className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 text-center"
        style={{ borderColor: copy.accent }}
        onClick={() => setIndex(Math.min(index + 1, slides.length))}
        disabled={isSummary}
      >
        <span className="text-5xl">{copy.emoji}</span>
        {isSummary ? (
          <>
            <span className="text-2xl font-bold">{title}</span>
            {wrapped.blurb && (
              <span className="text-muted-foreground">{wrapped.blurb}</span>
            )}
          </>
        ) : (
          <>
            <span className="text-2xl font-bold">{slides[index].headline}</span>
            {slides[index].detail && (
              <span className="text-muted-foreground">
                {slides[index].detail}
              </span>
            )}
          </>
        )}
      </button>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
        >
          Back
        </Button>
        {isSummary ? (
          <Button className="gap-2" onClick={share}>
            <Share2 size={14} />
            Share
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">Tap to continue</span>
        )}
      </div>

      <div
        aria-hidden
        className="pointer-events-none fixed top-0 -left-[9999px]"
      >
        <WrappedShareCard
          ref={cardRef}
          wrapped={wrapped}
          theme={theme}
          unit={unit}
          title={title}
        />
      </div>
    </div>
  );
}
