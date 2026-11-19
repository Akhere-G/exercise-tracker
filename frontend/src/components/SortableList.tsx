"use client";

import {
  closestCenter,
  DndContext,
  type DraggableAttributes,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";

const MOUSE_DRAG_DISTANCE_PX = 5;
const TOUCH_DRAG_TOLERANCE_PX = 5;

const SORTING_STRATEGIES = {
  vertical: verticalListSortingStrategy,
  horizontal: horizontalListSortingStrategy,
};

export interface SortableHandleProps {
  attributes: DraggableAttributes;
  listeners: ReturnType<typeof useSortable>["listeners"];
  setActivatorNodeRef: (element: HTMLElement | null) => void;
}

interface SortableListProps {
  ids: UniqueIdentifier[];
  onMove: (fromIndex: number, toIndex: number) => void;
  direction?: keyof typeof SORTING_STRATEGIES;
  touchDelayMs?: number;
  children: ReactNode;
}

export function SortableList({
  ids,
  onMove,
  direction = "vertical",
  touchDelayMs = 0,
  children,
}: SortableListProps) {
  const touchConstraint =
    touchDelayMs > 0
      ? { delay: touchDelayMs, tolerance: TOUCH_DRAG_TOLERANCE_PX }
      : undefined;

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: MOUSE_DRAG_DISTANCE_PX },
    }),
    useSensor(TouchSensor, { activationConstraint: touchConstraint }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    const fromIndex = ids.indexOf(active.id);
    const toIndex = ids.indexOf(over.id);
    if (fromIndex === -1 || toIndex === -1) return;

    onMove(fromIndex, toIndex);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={SORTING_STRATEGIES[direction]}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

export function SortableItem({
  id,
  children,
}: {
  id: UniqueIdentifier;
  children: (handle: SortableHandleProps) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "relative z-10 opacity-80" : undefined}
    >
      {children({ attributes, listeners, setActivatorNodeRef })}
    </div>
  );
}

export function DragHandle({
  handle,
  label,
}: {
  handle: SortableHandleProps;
  label: string;
}) {
  return (
    <button
      type="button"
      ref={handle.setActivatorNodeRef}
      {...handle.attributes}
      {...handle.listeners}
      aria-label={label}
      title="Drag to reorder"
      className="touch-none cursor-grab text-muted-foreground hover:text-foreground p-1 -m-1 rounded"
    >
      <GripVertical size={16} />
    </button>
  );
}
