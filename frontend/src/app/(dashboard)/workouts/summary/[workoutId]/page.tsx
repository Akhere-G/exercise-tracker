export default async function WorkoutSummary({
  params,
  searchParams,
}: {
  params: Promise<{ workoutId: string }>;
  searchParams: Promise<{ first: string }>;
}) {
  console.log(await params);
  console.log(await searchParams);
  return <div>WorkoutSummary</div>;
}
