"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TopItem } from "@/lib/types";

function TopItemPreview({
  item,
  rank,
  dragHandle,
  onRemove,
  showRemove = true,
  className,
}: {
  item: TopItem;
  rank: number;
  dragHandle?: React.ReactNode;
  onRemove?: () => void;
  showRemove?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "surface-row flex items-center gap-3 rounded-lg p-3 transition-shadow duration-200",
        className
      )}
    >
      <span className="rank-badge-card flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold">
        {rank}
      </span>
      {dragHandle}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{item.playerName}</p>
        <p className="text-xs text-text-muted">
          {item.position} · {item.nationality}
        </p>
      </div>
      {onRemove && showRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="surface-icon hover:text-red-400"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}

function SortableItem({
  item,
  rank,
  onRemove,
  disabled,
  showRemove = true,
}: {
  item: TopItem;
  rank: number;
  onRemove: () => void;
  disabled?: boolean;
  showRemove?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.playerId, disabled });

  const dragHandle =
    !disabled ? (
      <button
        type="button"
        className="surface-icon cursor-grab touch-none active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>
    ) : null;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(isDragging && "opacity-40")}
    >
      <TopItemPreview
        item={item}
        rank={rank}
        dragHandle={dragHandle}
        onRemove={onRemove}
        showRemove={showRemove}
        className={isDragging ? "shadow-lg" : undefined}
      />
    </div>
  );
}

export function TopList({
  items,
  onReorder,
  onRemove,
  disabled,
  showRemove = true,
  scrollContainerClassName,
}: {
  items: TopItem[];
  onReorder: (items: TopItem[]) => void;
  onRemove: (playerId: string) => void;
  disabled?: boolean;
  showRemove?: boolean;
  scrollContainerClassName?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeItem = activeId
    ? items.find((item) => item.playerId === activeId)
    : null;
  const activeRank = activeItem
    ? items.findIndex((item) => item.playerId === activeId) + 1
    : 0;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.playerId === active.id);
    const newIndex = items.findIndex((i) => i.playerId === over.id);
    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-card-border bg-off-white-muted p-8 text-center text-sm text-text-muted">
        Selecione jogadores da lista ao lado
      </div>
    );
  }

  const listContent = (
    <SortableContext
      items={items.map((i) => i.playerId)}
      strategy={verticalListSortingStrategy}
    >
      <div className="space-y-2">
        {items.map((item, index) => (
          <SortableItem
            key={item.playerId}
            item={item}
            rank={index + 1}
            onRemove={() => onRemove(item.playerId)}
            disabled={disabled}
            showRemove={showRemove}
          />
        ))}
      </div>
    </SortableContext>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {scrollContainerClassName ? (
        <div className={scrollContainerClassName}>{listContent}</div>
      ) : (
        listContent
      )}

      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <TopItemPreview
            item={activeItem}
            rank={activeRank}
            dragHandle={
              <span className="surface-icon">
                <GripVertical size={18} />
              </span>
            }
            showRemove={false}
            className="shadow-lg"
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
