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
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  createTask,
  deleteTask,
  fetchTasks,
  moveTask,
  updateTask,
} from "./actions/tasks";
import { SortableTaskItem } from "./components/SortableTaskItem";
import { TaskColumn } from "./components/TaskColumn";
import { Toast } from "./components/Toast";
import { applyDragEnd } from "./lib/dnd-utils";
import {
  CONTAINER_ALL,
  CONTAINER_TODAY,
  mergeColumns,
  splitByColumn,
  withDisplayOrder,
  type Task,
} from "./types/task";

const TODAY_DATE = new Date().toLocaleDateString("ru-RU", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showError = useCallback((message: string) => {
    setToast(message);
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await fetchTasks();
      if (error) {
        setLoadError(error);
        setTasks([]);
        return;
      }
      setTasks(data ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Не удалось загрузить задачи";
      setLoadError(message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const { backlog, today } = useMemo(() => splitByColumn(tasks), [tasks]);

  const backlogIds = useMemo(() => backlog.map((t) => t.id), [backlog]);
  const todayIds = useMemo(() => today.map((t) => t.id), [today]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const syncTasks = useCallback(
    async (nextTasks: Task[], snapshot: Task[]) => {
      const { error } = await moveTask(nextTasks);
      if (error) {
        setTasks(snapshot);
        showError(error);
      }
    },
    [showError],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const next = applyDragEnd(tasks, event);
      if (!next) return;

      const snapshot = tasks;
      setTasks(next);
      await syncTasks(next, snapshot);
    },
    [tasks, syncTasks],
  );

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    const optimistic: Task = {
      id: -Date.now(),
      title,
      is_completed: false,
      is_today: false,
      created_at: new Date().toISOString(),
      display_order: 0,
    };

    const snapshot = tasks;
    const next = mergeColumns([optimistic, ...backlog], today);
    setTasks(next);
    setNewTitle("");

    const { data, error } = await createTask(title);

    if (error) {
      setTasks(snapshot);
      showError(error);
      return;
    }

    if (data) {
      let withReal: Task[] = [];
      setTasks((prev) => {
        const { backlog: b, today: t } = splitByColumn(prev);
        withReal = mergeColumns(
          withDisplayOrder(b.map((x) => (x.id === optimistic.id ? data : x))),
          t,
        );
        return withReal;
      });
      await syncTasks(withReal, snapshot);
    }
  }

  async function handleToggleComplete(id: number) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const next = !task.is_completed;
    const snapshot = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_completed: next } : t)),
    );

    const { error } = await updateTask(id, { is_completed: next });
    if (error) {
      setTasks(snapshot);
      showError(error);
    }
  }

  async function handleDelete(id: number) {
    const removed = tasks.find((t) => t.id === id);
    const snapshot = tasks;
    setTasks((prev) => {
      const { backlog: b, today: t } = splitByColumn(prev);
      return mergeColumns(
        b.filter((x) => x.id !== id),
        t.filter((x) => x.id !== id),
      );
    });

    const { error } = await deleteTask(id);
    if (error && removed) {
      setTasks(snapshot);
      showError(error);
    }
  }

  return (
    <main className="min-h-full flex-1 bg-[#F9FAFB] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-center text-2xl font-bold tracking-tight text-gray-900">
          Alena
        </h1>

        {loadError ? (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <p className="font-semibold text-[#EF4444]">Ошибка загрузки данных</p>
            <p className="mt-1 break-words">{loadError}</p>
          </div>
        ) : null}

        {loading ? (
          <p className="mb-6 text-center text-sm text-gray-400">Загрузка...</p>
        ) : null}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col gap-8 md:grid md:grid-cols-2">
            <section className="order-1 rounded-xl bg-[#FFFFFF] p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Задачи на сегодня
                </h2>
                <p className="mt-1 text-sm text-gray-500">{TODAY_DATE}</p>
              </div>

              {loadError ? null : (
                <TaskColumn
                  id={CONTAINER_TODAY}
                  itemIds={todayIds}
                  empty={today.length === 0}
                  emptyMessage="Перетащите сюда задачи из «Все задачи»."
                >
                  {today.map((task) => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      containerId={CONTAINER_TODAY}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDelete}
                    />
                  ))}
                </TaskColumn>
              )}
            </section>

            <section className="order-2 rounded-xl bg-[#FFFFFF] p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Все задачи
              </h2>

              <form onSubmit={handleAdd} className="mb-6 flex gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Добавить задачу..."
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                >
                  Добавить
                </button>
              </form>

              {loadError ? null : (
                <TaskColumn
                  id={CONTAINER_ALL}
                  itemIds={backlogIds}
                  empty={backlog.length === 0}
                  emptyMessage="Нет задач. Добавьте выше или перетащите из «Задачи на сегодня»."
                >
                  {backlog.map((task) => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      containerId={CONTAINER_ALL}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDelete}
                    />
                  ))}
                </TaskColumn>
              )}
            </section>
          </div>
        </DndContext>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </main>
  );
}
