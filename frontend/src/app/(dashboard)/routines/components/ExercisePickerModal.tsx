"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Exercise, RankedExercise } from "@/src/features/exercises/types";
import { getAllExercises } from "@/src/features/exercises/actions";
import { track } from "@/src/features/analytics/utils";
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
  const [query, setQuery] = useState("");
  const [equipment, setEquipment] = useState("");
  const [muscle, setMuscle] = useState(defaultMuscle);

  const [exercises, setExercises] = useState<RankedExercise[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState<Record<number, Exercise>>({});

  const listRef = useRef<HTMLDivElement>(null);

  const addedIds = useMemo(
    () => new Set(addedExercises.map((e) => e.id)),
    [addedExercises],
  );

  const resetList = useCallback(() => {
    setExercises([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    setError("");
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function reset() {
      setSelected({});
      setMuscle(defaultMuscle);
      resetList();
    }
    reset();
  }, [isOpen, defaultMuscle, resetList]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const timeoutId = setTimeout(async () => {
      try {
        const results = await getAllExercises({
          search: query,
          equipment,
          muscle,
          page,
        });
        if (cancelled) return;

        if (query && page === 1) {
          track("search_exercises", {
            query_length: query.length,
            result_count: results.length,
            has_equipment_filter: Boolean(equipment),
            has_muscle_filter: Boolean(muscle),
          });
        }
        setHasMore(results.length > 0);
        setExercises((prev) => (page === 1 ? results : [...prev, ...results]));
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load exercises:", err);
        setError("Failed to load exercises.");
        setHasMore(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isOpen, query, equipment, muscle, page]);

  const canLoadMore = hasMore && !loading && !error && exercises.length > 0;

  function loadMore() {
    if (!canLoadMore) return;

    setLoading(true);
    setPage((p) => p + 1);
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) loadMore();
  }

  useEffect(() => {
    const el = listRef.current;
    if (el && el.scrollHeight <= el.clientHeight) loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises, canLoadMore]);

  function handleQueryChange(value: string) {
    setQuery(value);
    resetList();
  }

  function handleEquipmentChange(value: string) {
    setEquipment(value);
    resetList();
  }

  function handleMuscleChange(value: string) {
    setMuscle(value);
    resetList();
  }

  function toggleExercise(exercise: Exercise) {
    if (addedIds.has(exercise.id)) return;

    setSelected((prev) => {
      if (prev[exercise.id]) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [exercise.id]: _removed, ...rest } = prev;
        return rest;
      }
      return selectMany
        ? { ...prev, [exercise.id]: exercise }
        : { [exercise.id]: exercise };
    });
  }

  function handleSubmit() {
    onSelect(Object.values(selected));
    setSelected({});
  }

  const selectedCount = Object.keys(selected).length;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="border-secondary">
        <div className="flex items-baseline justify-between gap-4 p-4">
          <h2 className="text-xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground w-min"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 pt-0">
          <Input
            placeholder="Search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
          />
        </div>

        <div className="flex px-5 gap-4">
          <Select value={equipment} onValueChange={handleEquipmentChange}>
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

          <Select value={muscle} onValueChange={handleMuscleChange}>
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

        <div
          ref={listRef}
          onScroll={handleScroll}
          className="p-4 overflow-y-auto flex flex-col gap-2 h-[60vh]"
        >
          {error ? (
            <p className="text-sm text-destructive text-center py-4">{error}</p>
          ) : exercises.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center my-auto">
              {loading ? "Loading exercises..." : "No exercises found."}
            </p>
          ) : (
            exercises.map((exercise) => {
              const isSelected =
                !!selected[exercise.id] || addedIds.has(exercise.id);

              return (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => toggleExercise(exercise)}
                  className={`w-full  text-left p-2 rounded-xl border transition-all flex justify-between items-center ${
                    isSelected
                      ? "bg-secondary border-transparent"
                      : "hover:bg-secondary border-transparent hover:border-border"
                  }`}
                >
                  <span className="flex gap-4 w-full">
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
                    <span className="flex gap-2 justify-between items-center w-full">
                      <span>
                        <p className="font-semibold text-foreground">
                          {exercise.name}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {exercise.equipment} •{" "}
                          {exercise.muscles.map(({ name }) => name).join(", ")}
                        </p>
                      </span>
                      <p>workouts {exercise.workoutCount}</p>
                    </span>
                  </span>
                </button>
              );
            })
          )}

          {loading && exercises.length > 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Loading more exercises...
            </p>
          )}
        </div>

        <div className="p-4">
          <Button className="w-full" onClick={handleSubmit}>
            {submitBtnText} {selectedCount > 0 && `(${selectedCount})`}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
