import { Exercise } from "@/src/features/exercises/types";
import { getImageUrl } from "@/src/features/exercises/utils";
import Image from "next/image";

export function ExerciseImage({ exercise }: { exercise: Exercise }) {
  return (
    <div className="relative w-17 h-12 overflow-hidden bg-white rounded-md ">
      <Image
        src={getImageUrl(exercise.imageUrl)}
        alt={exercise.name}
        fill
        className="object-scale-down"
        sizes="68px"
      />
    </div>
  );
}
