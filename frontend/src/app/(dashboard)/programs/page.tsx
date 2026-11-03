import { getPrograms } from "@/src/features/programs/queries";
import ProgramCard from "@/src/features/programs/components/ProgramCard";

export default async function ProgramsPage() {
  const response = await getPrograms();
  const programs = response.success ? response.data : [];

  return (
    <div className="container flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Programs</h1>
        <p className="text-muted-foreground">
          Pick a proven plan and add it to your routines in one step.
        </p>
      </div>
      {!response.success && (
        <p className="text-destructive">{response.error}</p>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => (
          <ProgramCard key={program.slug} program={program} />
        ))}
      </div>
    </div>
  );
}
