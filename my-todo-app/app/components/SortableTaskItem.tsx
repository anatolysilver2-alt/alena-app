"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskItem } from "./TaskItem";
import type { Task } from "../types/task";

type SortableTaskItemProps = {
  task: Task;
  containerId: string;
  onToggleComplete: (id: number) => void;
  onDelete: (id: number) => void;
};

export function SortableTaskItem({
  task,
  containerId,
  onToggleComplete,
  onDelete,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { containerId },
    disabled: task.id < 0,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 ${isDragging ? "z-10 opacity-80" : ""}`}
    >
      <button
        type="button"
        className="shrink-0 cursor-grab touch-none rounded p-1 text-gray-400 hover:text-gray-600 active:cursor-grabbing disabled:cursor-default disabled:opacity-30"
        aria-label="Перетащить"
        disabled={task.id < 0}
        {...attributes}
        {...listeners}
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path d="M7 4a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2zM7 11a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2zM7 18a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      <TaskItem
        task={task}
        onToggleComplete={onToggleComplete}
        onDelete={onDelete}
      />
    </li>
  );
}
