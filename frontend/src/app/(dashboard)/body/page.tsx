import { getBodyWeights } from "@/src/features/body/queries";
import BodyWeightChart from "@/src/features/body/components/BodyWeightChart";
import BodyWeightForm from "@/src/features/body/components/BodyWeightForm";
import BodyWeightList from "@/src/features/body/components/BodyWeightList";

export default async function BodyPage() {
  const response = await getBodyWeights();
  const weights = response.success ? response.data : [];

  return (
    <div className="container flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Body weight</h1>
        <p className="text-muted-foreground">
          Log your weight to see how it trends alongside your training.
        </p>
      </div>
      {!response.success && (
        <p className="text-destructive">{response.error}</p>
      )}
      <BodyWeightForm />
      <BodyWeightChart weights={weights} />
      <BodyWeightList weights={weights} />
    </div>
  );
}
