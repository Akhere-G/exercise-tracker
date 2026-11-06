import { getPersonas } from "@/src/features/ai/queries";
import RoutineBuilder from "@/src/features/ai/components/RoutineBuilder";
import { getProfile } from "@/src/features/profile/queries";

export default async function BuildRoutinePage() {
  const [profile, personasResponse] = await Promise.all([
    getProfile(),
    getPersonas(),
  ]);
  const persona = personasResponse.success
    ? personasResponse.data.find((p) => p.slug === profile.coachPersona)
    : undefined;

  return (
    <div className="container flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Build with AI</h1>
        <p className="text-muted-foreground">
          Tell your coach what you have and what you want. You can review the
          plan before anything is saved.
        </p>
      </div>
      <RoutineBuilder persona={persona} />
    </div>
  );
}
