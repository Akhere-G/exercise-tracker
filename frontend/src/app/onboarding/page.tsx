import { getPersonas } from "@/src/features/ai/queries";
import OnboardingFlow from "@/src/features/onboarding/components/OnboardingFlow";

export default async function OnboardingPage() {
  const personas = await getPersonas();
  return <OnboardingFlow personas={personas.success ? personas.data : []} />;
}
