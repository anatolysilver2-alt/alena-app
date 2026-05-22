"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Task } from "../types/task";

type TaskItemProps = {
  task: Task;
  onToggleComplete: (id: number) => void;
  onDelete: (id: number) => void;
};

export function TaskItem({
  task,
  onToggleComplete,
  onDelete,
}: TaskItemProps) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <button
        type="button"
        onClick={() => onToggleComplete(task.id)}
        aria-label={task.is_completed ? "Снять отметку" : "Отметить выполненной"}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
          task.is_completed
            ? "border-[#3B82F6] bg-[#3B82F6] text-white"
            : "border-gray-300 bg-white hover:border-[#3B82F6]"
        }`}
      >
        {task.is_completed && (
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>

      <span
        className={`min-w-0 flex-1 text-sm ${
          task.is_completed ? "text-gray-400 line-through" : "text-gray-800"
        }`}
      >
        {task.title}
      </span>

      <div className="flex shrink-0 items-center gap-0.5">
        <Link
          href={`/task/${task.id}/edit`}
          aria-label="Редактировать"
          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <Pencil size={16} strokeWidth={2} />
        </Link>

        <button
          type="button"
          onClick={() => onDelete(task.id)}
          aria-label="Удалить"
          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-[#EF4444]"
        >
          <Trash2 size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
