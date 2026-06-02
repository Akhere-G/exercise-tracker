import { Exercise } from "@/src/features/exercises/types";
import Image from "next/image";

export function ExerciseImage({ exercise }: { exercise: Exercise }) {
  return (
    <div className="relative w-17 h-12 overflow-hidden bg-white rounded-md ">
      <Image
        src={`https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/refs/heads/main/${exercise.imageUrl}`}
        alt={exercise.name}
        fill
        className="object-scale-down"
      />
    </div>
  );
}
