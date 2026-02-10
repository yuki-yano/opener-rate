import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../../../lib/cn";

type SortableListProps<T extends { uid: string }> = {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T) => ReactNode;
  layout?: "list" | "grid";
  itemsClassName?: string;
  handleClassName?: string;
};

type SortableItemProps = {
  id: string;
  children: ReactNode;
  handleClassName?: string;
};

const SortableItem = ({ id, children, handleClassName }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  } as const;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "relative opacity-70" : "relative"}
    >
      <button
        type="button"
        className={cn(
          "group absolute left-2 z-10 inline-flex h-9 w-5 touch-none select-none items-center justify-center rounded-md border border-latte-surface1 bg-latte-base/90 text-latte-subtext0 shadow-sm transition hover:border-latte-blue/60 hover:text-latte-blue",
          handleClassName ?? "top-3",
        )}
        aria-label="ドラッグ"
        style={{ touchAction: "none" }}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 transition group-hover:scale-105" />
      </button>
      <div>{children}</div>
    </div>
  );
};

export const SortableList = <T extends { uid: string }>({
  items,
  onReorder,
  renderItem,
  layout = "list",
  itemsClassName,
  handleClassName,
}: SortableListProps<T>) => {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over == null || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.uid === active.id);
    const newIndex = items.findIndex((item) => item.uid === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.uid)}
        strategy={
          layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy
        }
      >
        <div
          className={cn(
            layout === "grid"
              ? "grid gap-3 sm:grid-cols-2 2xl:grid-cols-3"
              : "space-y-3",
            itemsClassName,
          )}
        >
          {items.map((item) => (
            <SortableItem
              key={item.uid}
              id={item.uid}
              handleClassName={handleClassName}
            >
              {renderItem(item)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
