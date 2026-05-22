"use server";

import { supabase } from "../lib/supabase";
import { TASK_SELECT, type Task } from "../types/task";

function logError(context: string, error: unknown) {
  console.error(`[tasks] ${context}:`, error);
}

export async function fetchTasks(): Promise<{
  data: Task[] | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    logError("fetchTasks", error);
    return { data: null, error: "Could not load tasks. Please try again." };
  }

  return { data: data as Task[], error: null };
}

export async function createTask(
  title: string,
): Promise<{ data: Task | null; error: string | null }> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title,
      is_completed: false,
      is_today: false,
      display_order: 0,
    })
    .select(TASK_SELECT)
    .single();

  if (error) {
    logError("createTask", error);
    return { data: null, error: "Could not add task. Please try again." };
  }

  return { data: data as Task, error: null };
}

export async function updateTask(
  id: number,
  updates: Partial<Pick<Task, "title" | "is_completed" | "is_today">>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("tasks").update(updates).eq("id", id);

  if (error) {
    logError("updateTask", error);
    return { error: "Could not update task. Please try again." };
  }

  return { error: null };
}

export async function deleteTask(
  id: number,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    logError("deleteTask", error);
    return { error: "Could not delete task. Please try again." };
  }

  return { error: null };
}

export async function getTask(
  id: number,
): Promise<{ data: Task | null; error: string | null }> {
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("id", id)
    .single();

  if (error) {
    logError("getTask", error);
    return { data: null, error: "Could not load task. Please try again." };
  }

  return { data: data as Task, error: null };
}

/** Atomically sync is_today and display_order for all persisted tasks. */
export async function moveTask(
  orderedTasks: Task[],
): Promise<{ error: string | null }> {
  const persisted = orderedTasks.filter((t) => t.id > 0);

  const results = await Promise.all(
    persisted.map((task) =>
      supabase
        .from("tasks")
        .update({
          is_today: task.is_today,
          display_order: task.display_order,
        })
        .eq("id", task.id),
    ),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    logError("moveTask", failed.error);
    return { error: "Could not save task changes. Please try again." };
  }

  return { error: null };
}

/** @deprecated Use moveTask — kept for internal callers. */
export const updateTaskOrder = moveTask;
