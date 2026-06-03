import { Card, CardContent, CardDescription } from "@/src/components/card";
import { LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

export default function ExerciseStat({
  Icon,
  title,
  subtitle,
}: {
  Icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  title: string | number;
  subtitle: string | number;
}) {
  return (
    <Card className="flex-1 min-w-17">
      <CardContent className="flex flex-col items-center justify-center gap-1">
        <div className="flex gap-2 items-center">
          <Icon size={20} />
          <p className="text-nowrap">{title}</p>
        </div>
        <CardDescription>{subtitle}</CardDescription>
      </CardContent>
    </Card>
  );
}
