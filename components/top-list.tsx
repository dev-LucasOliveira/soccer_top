"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
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

type TopItem = {
  playerId: string;
  playerName: string;
  position: string;
  nationality: string;
};

function SortableItem({
  item,
  rank,
  onRemove,
  disabled,
}: {
  item: TopItem;
  rank: number;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.playerId, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-card-border/60 bg-off-white/80 p-3 transition-shadow duration-200",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pitch text-sm font-bold text-off-white">
        {rank}
      </span>
      {!disabled && (
        <button
          type="button"
          className="cursor-grab text-pitch/40 hover:text-pitch"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{item.playerName}</p>
        <p className="text-xs text-text-muted">
          {item.position} · {item.nationality}
        </p>
      </div>
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          className="text-pitch/40 hover:text-red-500"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}

export function TopList({
  items,
  onReorder,
  onRemove,
  disabled,
}: {
  items: TopItem[];
  onReorder: (items: TopItem[]) => void;
  onRemove: (playerId: string) => void;
  disabled?: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.playerId === active.id);
    const newIndex = items.findIndex((i) => i.playerId === over.id);
    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-card-border bg-off-white-muted p-8 text-center text-sm text-text-muted">
        Selecione jogadores da lista ao lado
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
