import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/card";

export default function CreateRoutineSkeleton() {
  return (
    <div className="container relative">
      <Card>
        <CardHeader>
          <CardTitle className="title mb-2">
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="form space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
            </div>
            <div className="grid grid-cols-7 content-center items-center justify-center gap-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex justify-center">
                  <div className="w-10 h-10 md:w-15 md:h-15 bg-muted animate-pulse rounded-full" />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-4 my-2">
              <div className="h-5 w-40 bg-muted animate-pulse rounded" />
              <div className="h-32 w-full bg-muted animate-pulse rounded" />
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
