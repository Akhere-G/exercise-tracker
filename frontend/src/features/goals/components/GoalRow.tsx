interface GoalRowProps {
  label: string;
  detail: string;
  /** 0 to 1, omitted when there is no meaningful fraction to show. */
  progress?: number;
}

export default function GoalRow({ label, detail, progress }: GoalRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{detail}</span>
      </div>
      {progress !== undefined && (
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.min(progress, 1) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
