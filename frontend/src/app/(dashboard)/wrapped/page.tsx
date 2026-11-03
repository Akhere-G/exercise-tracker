import Link from "next/link";
import { getProfile } from "@/src/features/profile/queries";
import ThemePicker from "@/src/features/wrapped/components/ThemePicker";
import WrappedStory from "@/src/features/wrapped/components/WrappedStory";
import { getWrapped } from "@/src/features/wrapped/queries";
import { DEFAULT_THEME } from "@/src/features/wrapped/themes";
import { WrappedPeriod } from "@/src/features/wrapped/types";

const PERIODS: { value: WrappedPeriod; label: string }[] = [
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
];

const titleFor = (period: WrappedPeriod, start: string) => {
  const date = new Date(`${start}T00:00:00`);
  return period === "year"
    ? `${date.getFullYear()} Wrapped`
    : `${date.toLocaleString("en-US", { month: "long" })} Wrapped`;
};

export default async function WrappedPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const period: WrappedPeriod = params.period === "year" ? "year" : "month";
  const [response, profile] = await Promise.all([
    getWrapped(period),
    getProfile(),
  ]);
  const theme = profile.wrappedTheme ?? DEFAULT_THEME;

  return (
    <div className="container flex max-w-md flex-col gap-4">
      <h2 className="text-2xl">Wrapped</h2>
      <div className="flex gap-3 text-sm">
        {PERIODS.map(({ value, label }) => (
          <Link
            key={value}
            href={`/wrapped?period=${value}`}
            className={value === period ? "font-bold underline" : ""}
          >
            {label}
          </Link>
        ))}
      </div>
      <ThemePicker theme={theme} />
      {!response.success ? (
        <p className="text-destructive">Could not load your Wrapped.</p>
      ) : response.data.workoutCount === 0 ? (
        <p className="text-muted-foreground">
          No workouts in this period yet. Log a few and come back.
        </p>
      ) : (
        <WrappedStory
          key={`${period}-${theme}`}
          wrapped={response.data}
          theme={theme}
          title={titleFor(period, response.data.start)}
        />
      )}
    </div>
  );
}
