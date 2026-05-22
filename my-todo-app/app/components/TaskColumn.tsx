"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

type TaskColumnProps = {
  id: string;
  itemIds: number[];
  children: React.ReactNode;
  empty?: boolean;
  emptyMessage?: string;
};

export function TaskColumn({
  id,
  itemIds,
  children,
  empty,
  emptyMessage,
}: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <SortableContext
      id={id}
      items={itemIds}
      strategy={verticalListSortingStrategy}
    >
      <ul
        ref={setNodeRef}
        className={`min-h-[3rem] space-y-2 rounded-lg transition-shadow ${
          isOver ? "ring-2 ring-[#3B82F6]/30" : ""
        }`}
      >
        {empty && emptyMessage ? (
          <li className="pointer-events-none text-sm text-gray-400">
            {emptyMessage}
          </li>
        ) : null}
        {children}
      </ul>
    </SortableContext>
  );
}
