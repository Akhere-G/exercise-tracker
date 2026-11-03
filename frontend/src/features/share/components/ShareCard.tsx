import { forwardRef } from "react";

/** The branded frame shared cards sit in. Fixed size so the image is consistent. */
const ShareCard = forwardRef<
  HTMLDivElement,
  { title: string; subtitle?: string; children: React.ReactNode }
>(function ShareCard({ title, subtitle, children }, ref) {
  return (
    <div
      ref={ref}
      className="flex h-[480px] w-[360px] flex-col justify-between bg-background p-6 text-foreground"
    >
      <div>
        <p className="text-sm font-bold tracking-widest text-primary">GAINS</p>
        <h2 className="mt-2 text-2xl font-bold leading-tight">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
      <p className="text-xs text-muted-foreground">Tracked with Gains</p>
    </div>
  );
});

export default ShareCard;
