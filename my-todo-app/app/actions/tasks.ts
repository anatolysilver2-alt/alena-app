"use server";

import { getSupabase } from "../lib/supabase";
import { TASK_SELECT, type Task } from "../types/task";

function logError(context: string, error: unknown) {
  console.error(`[tasks] ${context}:`, error);
}

function formatError(context: string, error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const e = error as { message: string; code?: string; details?: string };
    const parts = [e.message, e.code && `code: ${e.code}`, e.details]
      .filter(Boolean)
      .join(" — ");
    return `[${context}] ${parts}`;
  }
  if (error instanceof Error) {
    return `[${context}] ${error.message}`;
  }
  return `[${context}] ${String(error)}`;
}

export async function fetchTasks(): Promise<{
  data: Task[] | null;
  error: string | null;
}> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("tasks")
      .select(TASK_SELECT)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      logError("fetchTasks", error);
      return { data: null, error: formatError("fetchTasks", error) };
    }

    return { data: (data ?? []) as Task[], error: null };
  } catch (err) {
    logError("fetchTasks", err);
    return { data: null, error: formatError("fetchTasks", err) };
  }
}

export async function createTask(
  title: string,
): Promise<{ data: Task | null; error: string | null }> {
  try {
    const supabase = getSupabase();
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
      return { data: null, error: formatError("createTask", error) };
    }

    return { data: data as Task, error: null };
  } catch (err) {
    logError("createTask", err);
    return { data: null, error: formatError("createTask", err) };
  }
}

export async function updateTask(
  id: number,
  updates: Partial<Pick<Task, "title" | "is_completed" | "is_today">>,
): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("tasks").update(updates).eq("id", id);

    if (error) {
      logError("updateTask", error);
      return { error: formatError("updateTask", error) };
    }

    return { error: null };
  } catch (err) {
    logError("updateTask", err);
    return { error: formatError("updateTask", err) };
  }
}

export async function deleteTask(
  id: number,
): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      logError("deleteTask", error);
      return { error: formatError("deleteTask", error) };
    }

    return { error: null };
  } catch (err) {
    logError("deleteTask", err);
    return { error: formatError("deleteTask", err) };
  }
}

export async function getTask(
  id: number,
): Promise<{ data: Task | null; error: string | null }> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("tasks")
      .select(TASK_SELECT)
      .eq("id", id)
      .single();

    if (error) {
      logError("getTask", error);
      return { data: null, error: formatError("getTask", error) };
    }

    return { data: data as Task, error: null };
  } catch (err) {
    logError("getTask", err);
    return { data: null, error: formatError("getTask", err) };
  }
}

/** Atomically sync is_today and display_order for all persisted tasks. */
export async function moveTask(
  orderedTasks: Task[],
): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabase();
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
      return { error: formatError("moveTask", failed.error) };
    }

    return { error: null };
  } catch (err) {
    logError("moveTask", err);
    return { error: formatError("moveTask", err) };
  }
}

/** @deprecated Use moveTask — kept for internal callers. */
export const updateTaskOrder = moveTask;
