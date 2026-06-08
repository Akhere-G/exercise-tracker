"use client";

import {
  useDeferredValue,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { Exercise } from "@/src/features/exercises/types";
import { getAllExercises } from "@/src/features/exercises/actions";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  equipmentOptions,
  muscleGroupOptions,
} from "@/src/features/exercises/constants";
import { Drawer, DrawerContent } from "@/src/components/ui/drawer";
import { X } from "lucide-react";
import Image from "next/image";
import { getImageUrl } from "@/src/features/exercises/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ExercisePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercises: Exercise[]) => void;
  addedExercises: Exercise[];
  selectMany?: boolean;
  title?: string;
  submitBtnText?: string;
  defaultMuscle?: string;
}

interface ExerciseItem extends Exercise {
  selected: boolean;
}

export function ExercisePickerModal({
  isOpen,
  onClose,
  onSelect,
  addedExercises,
  selectMany = true,
  title = "Add Exercises",
  submitBtnText = "Add",
  defaultMuscle = "",
}: ExercisePickerModalProps) {
  const [equipment, setEquipment] = useState("");
  const [muscle, setMuscle] = useState(defaultMuscle);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [formattedExercises, setFormattedExercises] = useState<ExerciseItem[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const router = useRouter();

  const [selectedExercises, setSelectedExercise] = useState<
    Record<number, Exercise>
  >({});
  const deferredQuery = useDeferredValue(query);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    function updateSelected() {
      if (isOpen) {
        const initialMap: Record<number, Exercise> = {};
        addedExercises.forEach((e) => {
          initialMap[e.id] = e;
        });
        setSelectedExercise(initialMap);
        setExercises([]);
        setPage(1);
        setHasMore(true);
      }
    }
    updateSelected();
  }, [isOpen, addedExercises]);

  useEffect(() => {
    function resetPage() {
      setPage(1);
      setHasMore(true);
    }
    resetPage();
  }, [deferredQuery, equipment, muscle]);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchExercises() {
      setLoading(true);
      try {
        const fetchedExercises = await getAllExercises({
          search: deferredQuery,
          equipment,
          muscle,
          page,
        });

        if (fetchedExercises.length === 0) {
          setHasMore(false);
        }

        setExercises((prev) =>
          page === 1 ? fetchedExercises : [...prev, ...fetchedExercises],
        );
      } catch (error) {
        console.error("Failed to load modal exercises:", error);
      } finally {
        setLoading(false);
      }
    }
    const timeout = setTimeout(() => fetchExercises(), 300);

    return () => clearTimeout(timeout);
  }, [isOpen, deferredQuery, page, equipment, muscle]);

  useEffect(() => {
    function getFormattedExercises() {
      setFormattedExercises(
        exercises.map((e) => ({
          ...e,
          selected: !!selectedExercises[e.id],
        })),
      );
    }
    getFormattedExercises();
  }, [exercises, selectedExercises]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMuscle(defaultMuscle);
  }, [defaultMuscle]);

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || !hasMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  function onClick(exercise: Exercise) {
    setSelectedExercise((prev) => {
      if (selectMany) {
        if (prev[exercise.id]) {
          const result = { ...prev };
          delete result[exercise.id];
          return result;
        }
        return { ...prev, [exercise.id]: exercise };
      }

      return prev[exercise.id] ? {} : { [exercise.id]: exercise };
    });
  }

  if (!isOpen) return null;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DrawerContent className="border-secondary">
        <div className="flex items-baseline justify-between gap-4 p-4">
          <h2 className="text-xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground w-min "
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5 pt-0">
          <Input
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex px-5 gap-4">
          <Select
            value={equipment}
            onValueChange={(value) => setEquipment(value)}
          >
            <SelectTrigger className="flex-1 w-full">
              <SelectValue placeholder="Equipment" />
            </SelectTrigger>
            <SelectContent>
              {equipmentOptions.map(({ title, value }) => (
                <SelectItem key={title} value={value}>
                  {title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={muscle} onValueChange={(value) => setMuscle(value)}>
            <SelectTrigger className="flex-1 w-full">
              <SelectValue placeholder="Muscle" />
            </SelectTrigger>
            <SelectContent>
              {muscleGroupOptions.map(({ title, value }) => (
                <SelectItem key={title} value={value}>
                  {title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 overflow-y-auto flex flex-col gap-2  max-h-[60vh]">
          {formattedExercises.length === 0 && loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Loading exercises...
            </p>
          ) : formattedExercises.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No exercises found.
            </p>
          ) : (
            formattedExercises.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => onClick(exercise)}
                className={` w-full text-left p-2 rounded-xl hover:bg-secondary border border-transparent hover:border-border transition-all flex justify-between items-center 
                  ${exercise.selected ? "bg-secondary" : ""}`}
              >
                <span className="flex gap-4">
                  <Link
                    onClick={(e) => e.stopPropagation()}
                    href={`/exercises/${exercise.id}`}
                    className="relative bg-white shrink-0 w-20 h-15 rounded-md overflow-hidden flex items-center justify-center p-2"
                  >
                    <Image
                      src={getImageUrl(exercise.imageUrl)}
                      alt={exercise.name}
                      width={70}
                      height={40}
                    />
                  </Link>
                  <span>
                    <p className="font-semibold text-foreground">
                      {exercise.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {exercise.equipment} •{" "}
                      {exercise.muscles.map(({ name }) => name).join(", ")}
                    </p>
                  </span>
                </span>
              </button>
            ))
          )}

          <div ref={lastElementRef} className="h-1" />

          {loading && formattedExercises.length > 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Loading more exercises...
            </p>
          )}
        </div>
        <div
          className="p-4"
          onClick={() => onSelect(Object.values(selectedExercises))}
        >
          <Button className="w-full">{submitBtnText}</Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
